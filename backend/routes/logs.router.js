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

// Mark event as read
router.put("/:id/read", verifyUser, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    if (!event.readBy.includes(req.user.id)) {
      event.readBy.push(req.user.id);
      await event.save();
    }

    res.json({ success: true, event });
  } catch (err) {
    next(err);
  }
});

export default router;