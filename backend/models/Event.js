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

const Event = mongoose.model("Event", eventSchema);

export default Event;