import express from "express";
import Comment from "../models/Comment.modal.js";
import Task from "../models/task.modal.js";
import User from "../models/user.modals.js";
import Log from "../models/Event.js";
import { verifyUser } from "../utils/verifyUser.js";
import mongoose from "mongoose";

const router = express.Router();

// Get all comments for a task
router.get("/tasks/:taskId", verifyUser, async (req, res) => {
  try {
    const { taskId } = req.params;

    const comments = await Comment.find({
      task: taskId,
      isDeleted: false,
      parentComment: null, // Only get top-level comments
    })
      .populate("author", "name email profilePicUrl")
      .populate("mentions", "name email profilePicUrl")
      .populate({
        path: "replies",
        match: { isDeleted: false },
        populate: [
          { path: "author", select: "name email profilePicUrl" },
          { path: "mentions", select: "name email profilePicUrl" },
        ],
      })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      comments,
      count: comments.length,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create a new comment
router.post("/", verifyUser, async (req, res) => {
  try {
    const { taskId, content,mentions, parentCommentId } = req.body;
    const userId = req.user.id || req.user._id;

    if (!content || content.trim().length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Comment content is required" });
    }

    // Verify task exists
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    // Extract mentions from content (e.g., @username)
    const mentionPattern = /@(\w+)/g;
    const contentMentions = [];
    let match;
    while ((match = mentionPattern.exec(content)) !== null) {
      contentMentions.push(match[1]);
    }

    // Get mentioned users
    let mentionedUsers = [];
    if (mentions && mentions.length > 0) {
      mentionedUsers = await User.find({
        _id: { $in: mentions },
      }).select("_id name email");
    }

    // Create comment
    const comment = new Comment({
      task: taskId,
      author: userId,
      content: content.trim(),
      mentions: mentionedUsers.map((u) => u._id),
      parentComment: parentCommentId || null,
    });

    await comment.save();

    // Populate author and mentions
    await comment.populate("author", "name email profilePicUrl");
    await comment.populate("mentions", "name email profilePicUrl");

    // Update task
    if (parentCommentId) {
      // Add to parent comment replies
      await Comment.findByIdAndUpdate(parentCommentId, {
        $push: { replies: comment._id },
      });
    } else {
      // Add to task comments
      await Task.findByIdAndUpdate(taskId, {
        $push: { comments: comment._id },
        $inc: { commentCount: 1 },
        lastCommentAt: new Date(),
      });
    }

    // Get author info
    const author = await User.findById(userId).select("name email profilePicUrl");
    console.log("author info: ", author);
    
    

    // Create notifications for mentions
    if (mentionedUsers.length > 0) {
      const io = req.app.get("io");

      for (const mentionedUser of mentionedUsers) {
        // Create log entry
        const log = new Log({
            actor: {
              _id: userId,
              name: author?.name,
              email: author?.email,
            },
          task: {
            _id: task._id,
            title: task.title,
          },
          targets: [
            {
              _id: mentionedUser._id,
              name: mentionedUser,
            },
          ],
          type: "user_mentioned",
          meta: {
            commentId: comment._id,
            commentContent: content.substring(0, 100),
          },
        });

        await log.save();

        // Emit socket event
        if (io) {
          io.to(`user:${mentionedUser._id}`).emit("notification:new", log);
          io.emit("notification:new", log);
        }
      }
    }

    // Emit socket event for new comment (send plain object with populated fields)
    const io = req.app.get("io");
    if (io) {
      const commentObj = comment.toObject();
      io.to(`task:${taskId}`).emit("comment:new", commentObj);
    }

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment,
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update a comment
router.put("/:commentId", verifyUser, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id || req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });
    }

    // Check if user is the author
    if (comment.author.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own comments"
      });
    }

    if (!content || content.trim().length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Comment content is required" });
    }

    // Extract new mentions
    const mentionPattern = /@(\w+)/g;
    const contentMentions = [];
    let match;
    while ((match = mentionPattern.exec(content)) !== null) {
      contentMentions.push(match[1]);
    }

    comment.content = content.trim();
    comment.isEdited = true;
    comment.editedAt = new Date();
    await comment.save();

    await comment.populate("author", "name email profilePicUrl");
    await comment.populate("mentions", "name email profilePicUrl");

    // Emit socket event (send plain object with populated fields)
    const io = req.app.get("io");
    if (io) {
      const commentObj = comment.toObject();
      io.to(`task:${comment.task}`).emit("comment:updated", commentObj);
    }

    res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      comment,
    });
  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete a comment
router.delete("/:commentId", verifyUser, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id || req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });
    }

    // Check if user is the author
    if (comment.author.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own comments"
      });
    }
    // Soft delete
    comment.isDeleted = true;
    await comment.save();

    // Update task comment count
    if (!comment.parentComment) {
      await Task.findByIdAndUpdate(comment.task, {
        $inc: { commentCount: -1 },
      });
    }

    // Emit socket event
    const io = req.app.get("io");
    if (io) {
      io.to(`task:${comment.task}`).emit("comment:deleted", {
        commentId: comment._id,
      });
    }

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add reaction to comment
router.post("/:commentId/reaction", verifyUser, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { emoji } = req.body;
       console.log("req.user:", req.user);
    const userId = req.user.id || req.user._id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });
    }

    // Check if user already reacted
    const existingReaction = comment.reaction?.find(
      (r) => r?.user && r.user.toString() === userId.toString()
    );

    if (existingReaction) {
      // Update existing reaction
      existingReaction.emoji = emoji;
      existingReaction.createdAt = new Date();
    } else {
      // Add new reaction
      comment.reaction.push({
        user: userId,
        emoji,
      });
    }

    await comment.save();
    await comment.populate("reaction.user", "name email profilePicUrl");

    // Emit socket event
    const io = req.app.get("io");
    if (io) {
      io.to(`task:${comment.task}`).emit("comment:reaction", {
        commentId: comment._id,
        reaction: comment.reaction,
      });
    }

    res.status(200).json({
      success: true,
      message: "Reaction added successfully",
      reaction: comment.reaction,
    });
  } catch (error) {
    console.error("Error adding reaction:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Remove reaction from comment
router.delete("/:commentId/reaction", verifyUser, async (req, res) => {
  try {
    const { commentId } = req.params;
       console.log("req.user:", req.user);
    const userId = req.user.id || req.user._id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });
    }

    comment.reaction = comment.reaction?.filter(
      (r) => r?.user && r.user.toString() !== userId.toString()
    ) || [];

    await comment.save();

    // Emit socket event
    const io = req.app.get("io");
    if (io) {
      io.to(`task:${comment.task}`).emit("comment:reaction", {
        commentId: comment._id,
        reaction: comment.reaction,
      });
    }

    res.status(200).json({
      success: true,
      message: "Reaction removed successfully",
      reaction: comment.reaction,
    });
  } catch (error) {
    console.error("Error removing reaction:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;