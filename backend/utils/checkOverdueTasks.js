import Task from "../models/task.modal.js";
import User from "../models/user.modals.js";
import createEvent from "./LoggerHelper.js";

/**
 * Check for overdue tasks and notify admins
 * Run this periodically (e.g., cron job or scheduler)
 */
export async function checkOverdueTasks(io) {
  try {
    const now = new Date();
    const overdueTasks = await Task.find({
      dueDate: { $lt: now },
      status: { $ne: "completed" },
      overdueNotified: { $ne: true }, // avoid duplicate notifications
    });

    if (!overdueTasks.length) return;

    const admins = await User.find({ role: "admin" }).select("_id");
    const adminIds = admins.map((a) => String(a._id));

    for (const task of overdueTasks) {
      await createEvent({
        type: "task_overdue",
        actor: null,
        targets: adminIds,
        task: String(task._id),
        meta: { title: task.title, dueDate: task.dueDate },
        io,
      });

      // mark as notified to avoid spam
      task.overdueNotified = true;
      await task.save();
    }

    console.log(`Checked overdue tasks: ${overdueTasks.length} found`);
  } catch (err) {
    console.error("checkOverdueTasks error:", err);
  }
}

export default checkOverdueTasks;