import mongoose from "mongoose";
const { Schema } = mongoose;

const todoSchema = new Schema({
  text: { type: String, required: true },
  completed: { type: Boolean, default: false },
});

const taskSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },

    status: {
      type: String,
      enum: ["pending", "in-progress", "completed"],
      default: "pending",
    },

    dueDate: { type: Date },

    // allow multiple assignees (array of ObjectId referencing the User model)
    assignedTo: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],

    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },

    // createdBy usually a single user
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

    attachments: [{ type: String }],

    tags: [{ type: String }],

    todoCheckList: [todoSchema],

    progress: { type: Number, default: 0 },

    overdueNotified: { type: Boolean, default: false },

    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    commentCount: {
      type: Number,
      default: 0,
    },
    lastCommentAt: Date,
  },
  { timestamps: true }
);

// Indexes for performance optimization
taskSchema.index({ status: 1, createdAt: -1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ tags: 1 });
taskSchema.index({ status: 1, assignedTo: 1 });
taskSchema.index({ status: 1, priority: 1, dueDate: 1 });

export default mongoose.model("Task", taskSchema);
