import User from "../models/user.modals.js"
import Task from "../models/task.modal.js"
import { ErrorHandler } from "../utils/error.js"

export const getUser = async(req, res, next) =>{
    try {
        const user = await User.find({role: "user"}).select("-password")

        const userWithTaskCount = await Promise.all(
            user.map(async(user)=>{
                const pendingTasks = await Task.countDocuments({
                    assignedTo: user._id,
                    status: "pending",
                })
                const inProgressTasks = await Task.countDocuments({
                    assignedTo: user._id,
                    status: "inProgress",
                })
                const completedTasks = await Task.countDocuments({
                    assignedTo: user._id,
                    status: "completed",
                })

                return({
                    ...user._doc,
                    pendingTasks,
                    inProgressTasks,
                    completedTasks
                })
            })
        )

        res.status(200).json(userWithTaskCount)

    } catch (error) {
        next(error)
    }
}

export const getUserById = async (req, res, next) => {
    try {
        // accept many common param names and fallback to authenticated user
        const id = req.params._id || req.params.id || req.params.userId || req.user?.id;
        // console.log("getUserById -> looking for id:", id);

        if (!id) return next(ErrorHandler(400, "Missing user id"));

        const user = await User.findById(id).select("-password");
        if (!user) return next(ErrorHandler(404, "User not found"));

        return res.status(200).json({ success: true, user });
    } catch (error) {
        console.error("getUserById error:", error);
        return next(error);
    }
}