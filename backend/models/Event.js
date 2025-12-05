import mongoose from "mongoose";

const EventSchema = new mongoose.Schema({
  type: { type: String, required: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  targets: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  meta: { type: mongoose.Schema.Types.Mixed },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Event || mongoose.model("Event", EventSchema);