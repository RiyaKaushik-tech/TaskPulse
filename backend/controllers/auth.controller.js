import createEvent from "../utils/LoggerHelper.js";
import User from "../models/user.modals.js"
import bcryptjs from "bcryptjs"
import { ErrorHandler } from "../utils/error.js"
import jwt from "jsonwebtoken"
import path from "path"

export const signUp = async (req, res, next) => {
  const { name, email, password, profileImageUrl, adminJoinCode } = req.body

  if (
    !name ||
    !email ||
    !password ||
    name === "" ||
    email === "" ||
    password === ""
  ) {
    return next(ErrorHandler(400, "All fields are required"))
  }

  //   Check if user already exists
  const isAlreadyExist = await User.findOne({ email })

  if (isAlreadyExist) {
    return next(ErrorHandler(400, "User already exists"))
  }

  //   check user role
  let role = "user"

  if (adminJoinCode && adminJoinCode === process.env.ADMIN_JOIN_CODE) {
    role = "admin"
  }

  const hashedPassword = bcryptjs.hashSync(password, 10)

  const newUser = new User({
    name,
    email,
    password: hashedPassword,
    profileImageUrl,
    role,
  })

  try {
    await newUser.save()

    // LOG: user_signup event (notify all admins)
    const admins = await User.find({ role: "admin" }).select("_id");
    const adminIds = admins.map((a) => String(a._id));
    if (adminIds.length) {
      await createEvent({
        type: "user_signup",
        actor: String(newUser._id),
        targets: adminIds,
        task: null,
        meta: { userName: newUser.name, userEmail: newUser.email },
        io: req.app.locals.io,
      });
    }

    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET
    )

    const { password: pass, ...rest } = newUser._doc

    res.status(200).cookie("access_token", token, { httpOnly: true }).json(rest)
  } catch (error) {
    next(error.message)
  }
}

export const SignIn = async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password || email === "" || password === "") {
      return next(ErrorHandler(400, "All fields are required"))
    }

    const validUser = await User.findOne({ email })

    if (!validUser) {
      return next(ErrorHandler(404, "User not found!"))
    }

    // compare password
    const validPassword = bcryptjs.compareSync(password, validUser.password)

    if (!validPassword) {
      return next(ErrorHandler(400, "Wrong Credentials"))
    }

    const token = jwt.sign(
      { id: validUser._id, role: validUser.role },
      process.env.JWT_SECRET
    )

    const { password: pass, ...rest } = validUser._doc

    res.status(200).cookie("access_token", token, { httpOnly: true }).json(rest)
  } catch (error) {
    next(error)
  }
}

export const userProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)

    if (!user) {
      return next(ErrorHandler(404, "User not found!"))
    }

    const { password: pass, ...rest } = user._doc

    res.status(200).json(rest)
  } catch (error) {
    next(error)
  }
}

export const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)

    if(!user){
      return next(ErrorHandler(404, "User not found!"))
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    if(req.body.password){
      user.password = bcryptjs.hashSync(req.body.password, 10);
    }

    const updatedUser = await user.save();

    const {password:pass , ...rest} = updatedUser._doc;

    res.status(200).json(rest);

  } catch (error) {
    
  }
}

export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) return next(ErrorHandler(400, "Image not found"));

    // safe filename (already set by multer)
    const filename = path.basename(req.file.filename);
    const imageURL = `${req.protocol}://${req.get("host")}/uploads/${filename}`;

    return res.status(200).json({ success: true, imageURL });
  } catch (error) {
    console.error("uploadImage error:", error);
    return next(ErrorHandler(500, "Internal server error"));
  }
}

export const signout = async (req, res, next) => {
  try {
    res
      .clearCookie("access_token")
      .status(200)
      .json("User has been logged-out successfully!")
  } catch (error) {
    next(error)
  }
}