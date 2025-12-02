import mongoose from "mongoose";
const { Schema } = mongoose;

const todoSchema = new Schema({
  text: { type: String, required: true },
  completed: { type: Boolean, default: false },
});

const TaskSchema = new Schema(
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
  },
  { timestamps: true }
);

export default mongoose.model("Task", TaskSchema);
