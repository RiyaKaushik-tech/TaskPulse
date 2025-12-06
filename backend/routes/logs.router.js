import express from "express";
import { verifyUser, adminOnly } from "../utils/verifyUser.js";
import Event from "../models/Event.js";

const router = express.Router();

// Get logs for current user (notifications)
router.get("/user", verifyUser, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const events = await Event.find({ targets: userId })
      .populate("actor", "name email profileImageUrl")
      .populate("task", "title status")
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, events });
  } catch (err) {
    next(err);
  }
});

// Get logs for admin (all events)
router.get("/admin", verifyUser, adminOnly, async (req, res, next) => {
  try {
    const events = await Event.find({})
      .populate("actor", "name email profileImageUrl")
      .populate("task", "title status")
      .populate("targets", "name email")
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({ success: true, events });
  } catch (err) {
    next(err);
  }
});

// Get unread count for current user
router.get("/user/unread-count", verifyUser, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const count = await Event.countDocuments({
      targets: userId,
      readBy: { $ne: userId },
    });

    res.json({ success: true, count });
  } catch (err) {
    next(err);
  }
});

// Mark event as read
router.put("/:id/read", verifyUser, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    const userId = String(req.user.id);
    const readByIds = event.readBy.map(id => String(id));
    
    if (!readByIds.includes(userId)) {
      event.readBy.push(req.user.id);
      await event.save();
    }

    res.json({ success: true, event });
  } catch (err) {
    next(err);
  }
});

// Delete notification (user can delete their own notifications)
router.delete("/:id", verifyUser, async (req, res, next) => {
  try {
    console.log("Delete request for ID:", req.params.id);
    
    const event = await Event.findById(req.params.id);
    if (!event) {
      console.log("Event not found");
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    const userId = String(req.user.id);
    const targetIds = (event.targets || []).map(t => String(t));
    const isTarget = targetIds.includes(userId);
    const isAdmin = req.user.role === "admin";

    console.log("User ID:", userId, "Is Target:", isTarget, "Is Admin:", isAdmin);

    if (!isTarget && !isAdmin) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    await Event.findByIdAndDelete(req.params.id);
    console.log("Event deleted successfully");

    // Emit socket event to all relevant users
    const io = req.app.locals.io;
    if (io) {
      // Notify the user who deleted it
      io.to(`user:${userId}`).emit("notification:deleted", { id: String(req.params.id) });
      
      // If admin deleted, notify all targets
      if (isAdmin) {
        targetIds.forEach(tId => {
          io.to(`user:${tId}`).emit("notification:deleted", { id: String(req.params.id) });
        });
      }
    }

    res.json({ success: true, message: "Notification deleted" });
  } catch (err) {
    console.error("Delete error:", err);
    next(err);
  }
});

// Bulk delete for admin
router.post("/admin/bulk-delete", verifyUser, adminOnly, async (req, res, next) => {
  try {
    const { ids } = req.body;
    console.log("Bulk delete request for IDs:", ids);
    
    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ success: false, message: "Provide array of ids" });
    }

    // Get all events to notify their targets
    const events = await Event.find({ _id: { $in: ids } }).select("targets");
    console.log("Found events to delete:", events.length);
    
    const allTargets = [...new Set(events.flatMap(e => (e.targets || []).map(t => String(t))))];

    const result = await Event.deleteMany({ _id: { $in: ids } });
    console.log("Deleted count:", result.deletedCount);

    // Emit socket event to all affected users
    const io = req.app.locals.io;
    if (io) {
      const idsAsStrings = ids.map(id => String(id));
      allTargets.forEach(targetId => {
        io.to(`user:${targetId}`).emit("notification:bulk-deleted", { ids: idsAsStrings });
      });
      // Also emit to all connected sockets for admins
      io.emit("notification:bulk-deleted", { ids: idsAsStrings });
    }

    res.json({ 
      success: true, 
      message: `${result.deletedCount} log(s) deleted`,
      deletedCount: result.deletedCount 
    });
  } catch (err) {
    console.error("Bulk delete error:", err);
    next(err);
  }
});

export default router;