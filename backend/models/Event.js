import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      "task_created",
      "task_assigned",
      "task_completed",
      "user_mentioned",
      "user_signup",
      "task_overdue",
      "user_absent",
    ],
  },
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  targets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
    default: null,
  },
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
}, {
  timestamps: true,
});

// Indexes for performance optimization
eventSchema.index({ targets: 1, createdAt: -1 });
eventSchema.index({ type: 1 });
eventSchema.index({ task: 1 });
eventSchema.index({ targets: 1, readBy: 1 });
eventSchema.index({ actor: 1 });

const Event = mongoose.model("Event", eventSchema);

export default Event;