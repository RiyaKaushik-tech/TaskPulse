import express from "express";
import { adminOnly, verifyUser } from "../utils/verifyUser.js";
import {
  createTask,
  deleteTask,
  getDashboardData,
  getTask,
  getTaskById,
  getUserDashboardData,
  updateTask,
  updateTaskStatus,
  updateTodoChecklist
} from "../controllers/task.controller.js";
import createEvent from "../utils/LoggerHelper.js";
import { ErrorHandler } from "../utils/error.js";
import Task from "../models/task.modal.js";
import User from "../models/user.modals.js";
import mongoose from "mongoose";

const router = express.Router();

router.post("/create-task", verifyUser, adminOnly, createTask);
router.get("/", verifyUser, getTask);
router.get("/dashboard-data", verifyUser, adminOnly, getDashboardData);
router.get("/user-dashboard-data", verifyUser, getUserDashboardData);
router.get("/:id", verifyUser, getTaskById);
router.put("/:id", verifyUser, updateTask);
router.delete("/:id", verifyUser, adminOnly, deleteTask);
router.put("/:id/status", verifyUser, updateTaskStatus);
router.put("/:id/todo", verifyUser, updateTodoChecklist);

// Add comment route (if not exists) to handle mentions
router.post("/:id/comment", verifyUser, async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) return next(ErrorHandler(400, "Comment text required"));

    const task = await Task.findById(req.params.id);
    if (!task) return next(ErrorHandler(404, "Task not found"));

    // Extract mentions from text (e.g., @userId or @username)
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }

    // Find mentioned users by name or id
    const mentionedUsers = await User.find({
      $or: [
        { _id: { $in: mentions.filter((m) => mongoose.Types.ObjectId.isValid(m)) } },
        { name: { $in: mentions } },
      ],
    }).select("_id");

    const mentionedIds = mentionedUsers.map((u) => String(u._id));

    // Save comment (add comments array to task schema if not present)
    if (!task.comments) task.comments = [];
    task.comments.push({ user: req.user.id, text, createdAt: new Date() });
    await task.save();

    // LOG: user_mentioned event
    if (mentionedIds.length) {
      await createEvent({
        type: "user_mentioned",
        actor: req.user.id,
        targets: mentionedIds,
        task: String(task._id),
        meta: { comment: text, taskTitle: task.title },
        io: req.app.locals.io,
      });
    }

    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
});

export default router;
