import createEvent from "../utils/LoggerHelper.js";
import User from "../models/user.modals.js"
import bcryptjs from "bcryptjs"
import { ErrorHandler } from "../utils/error.js"
import jwt from "jsonwebtoken"
import path from "path"

export const signUp = async (req, res, next) => {
  const { name, email, password, profilePicUrl, adminJoinCode } = req.body

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
    profilePicUrl,
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

    // --- Update Last Login Time for Attendance Tracking ---
    const now = new Date();
    const lastLogin = validUser.lastLoginDate ? new Date(validUser.lastLoginDate) : null;
    const lastLoginDay = lastLogin ? new Date(lastLogin.getFullYear(), lastLogin.getMonth(), lastLogin.getDate()) : null;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Only update if this is a new day login
    const alreadyLoggedInToday = lastLoginDay && lastLoginDay.getTime() === today.getTime();

    if (!alreadyLoggedInToday) {
      // Calculate days difference for streak logic
      const daysDiff = lastLoginDay ? Math.floor((today - lastLoginDay) / (1000 * 60 * 60 * 24)) : null;

      if (daysDiff === null) {
        // First login ever
        validUser.loginStreak = 1;
      } else if (daysDiff === 1) {
        // Consecutive day - increment streak
        validUser.loginStreak += 1;
      } else if (daysDiff > 1) {
        // Missed days - reset streak
        validUser.loginStreak = 1;
      }

      // Update last login date (attendance record will be created by daily checker)
      validUser.lastLoginDate = now;
      await validUser.save();

      // Emit real-time login notification
      const io = req.app.get("io");
      if (io) {
        // Get all admins for real-time updates
        const admins = await User.find({ role: "admin" }).select("_id");
        const adminIds = admins.map((a) => String(a._id));

        // Notify admins about user login
        adminIds.forEach(adminId => {
          io.to(`user:${adminId}`).emit("user:login", {
            userId: String(validUser._id),
            userName: validUser.name,
            loginTime: now,
            loginStreak: validUser.loginStreak
          });
        });
      }
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