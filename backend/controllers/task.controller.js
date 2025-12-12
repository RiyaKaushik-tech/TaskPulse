import { ErrorHandler } from "../utils/error.js";
import Task from "../models/task.modal.js";
import mongoose from "mongoose";
import createEvent from "../utils/LoggerHelper.js";

// Utility to robustly accept attachments in several shapes (array, JSON-string, util.inspect string)
const normalizeAttachmentsInput = (input) => {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  if (typeof input === "string") {
    // try native JSON first
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // attempt to repair common non-JSON inspector output:
      try {
        const repaired = input
          .replace(/(['"])?([a-zA-Z0-9_]+)\1\s*:/g, '"$2":') // quote keys
          .replace(/'([^']*)'/g, '"$1"'); // single -> double quotes
        const parsed2 = JSON.parse(repaired);
        if (Array.isArray(parsed2)) return parsed2;
      } catch (e2) {
        // fallback: extract URLs if present
        try {
          const urls = Array.from(input.matchAll(/https?:\/\/[^\s'"]+/g)).map((m) => m[0]);
          if (urls.length) return urls;
        } catch (ignore) {}
      }
    }
  }
  return [];
};

// Helper to map mixed items (string or object) -> url/path string
const mapAttachmentToString = (item) => {
  if (!item) return "";
  if (typeof item === "string") return item;
  if (typeof item === "object") {
    return item.url || item.path || item.originalname || item.originalName || "";
  }
  return "";
};

export const createTask = async (req, res, next) => {
  try {
    const {
      title,
      description,
      priority,
      dueDate,
      assignedTo = [],
      attachment,
      todoCheckList,
      todoChecklist,
      tags = [],
    } = req.body || {};

    if (!req.user?.id) return next(ErrorHandler(401, "Unauthorized"));
    if (!title) return next(ErrorHandler(400, "Title is required"));

    // Normalize attachments: accept array-of-strings, array-of-objects, or various string shapes
    let normalizedAttachmentsRaw = [];
    if (req.body.attachments !== undefined) {
      normalizedAttachmentsRaw = normalizeAttachmentsInput(req.body.attachments);
    } else if (attachment) {
      normalizedAttachmentsRaw = [attachment];
    }

    const normalizedAttachments = normalizedAttachmentsRaw
      .map(mapAttachmentToString)
      .filter(Boolean);

    if (!Array.isArray(assignedTo))
      return next(ErrorHandler(400, "assignedTo must be an array"));

    const assignees = assignedTo.map((id) =>
      mongoose.Types.ObjectId.isValid(String(id))
        ? new mongoose.Types.ObjectId(String(id))
        : id
    );

    const rawList = Array.isArray(todoCheckList)
      ? todoCheckList
      : Array.isArray(todoChecklist)
      ? todoChecklist
      : [];

    const normalizedTodo = rawList
      .map((item) => ({
        text: String(item?.text ?? item?.task ?? "").trim(),
        completed: !!item?.completed,
      }))
      .filter((i) => i.text.length > 0);

    const normPriority = (priority || "medium").toLowerCase();

    const task = await Task.create({
      title,
      description,
      priority: normPriority,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      assignedTo: assignees,
      attachments: normalizedAttachments,
      todoCheckList: normalizedTodo,
      tags: Array.isArray(tags) ? tags : [],
      createdBy: req.user.id,
      status: "pending",
      progress: 0,
    });

    // LOG: task_created event
    await createEvent({
      type: "task_created",
      actor: req.user.id,
      targets: assignees.map(String),
      task: String(task._id),
      meta: { title: task.title, priority: task.priority },
      io: req.app.locals.io,
    });

    // LOG: task_assigned event for each assignee
    if (assignees.length) {
      await createEvent({
        type: "task_assigned",
        actor: req.user.id,
        targets: assignees.map(String),
        task: String(task._id),
        meta: { title: task.title },
        io: req.app.locals.io,
      });
    }

    return res.status(201).json({ success: true, task });
  } catch (err) {
    console.error("createTask error:", err);
    next(err);
  }
};

export const getTask = async (req, res, next) => {
  try {
    let { status, search, sortBy, sortOrder, assignedToUser, tags } = req.query;

    let filter = {};
    if (status) {
      filter.status = status;
    }

    // Search by title (case-insensitive)
    if (search) {
      // Escape special regex characters to prevent ReDoS attacks
      const escapedSearch = String(search).replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );
      filter.title = { $regex: escapedSearch, $options: "i" };
    }

    // Filter by tags
    if (tags) {
      let tagArray = [];
      if (Array.isArray(tags)) {
        tagArray = tags;
      } else if (typeof tags === "string") {
        tagArray = tags.split(",").map((t) => t.trim());
      } else {
        tagArray = [String(tags)];
      }
      if (tagArray.length > 0 && tagArray[0] !== "") {
        filter.tags = { $in: tagArray };
      }
    }

    // Filter by assignedTo user (only for admin)
    if (
      assignedToUser &&
      req.user.role === "admin" &&
      mongoose.Types.ObjectId.isValid(assignedToUser)
    ) {
      filter.assignedTo = new mongoose.Types.ObjectId(assignedToUser);
    }

    if (!req.user || !req.user.id)
      return next(ErrorHandler(401, "Unauthorized"));

    let query;

    if (req.user.role === "admin") {
      query = Task.find(filter).populate(
        "assignedTo",
        "name email profilePicUrl"
      );
    } else {
      query = Task.find({
        ...filter,
        assignedTo: req.user.id,
      }).populate("assignedTo", "name email profilePicUrl");
    }

    // Apply sorting at database level
    if (sortBy) {
      const order = sortOrder === "desc" ? -1 : 1;
      if (sortBy === "createdAt" || sortBy === "assignedDate") {
        query = query.sort({ createdAt: order });
      } else if (sortBy === "dueDate" || sortBy === "deadline") {
        query = query.sort({ dueDate: order });
      }
    }

    let tasks = await query;

    tasks = await Promise.all(
      tasks.map(async (task) => {
        const completeCount = (task.todoCheckList || []).filter(
          (item) => item.completed
        ).length;

        return { ...task._doc, completeCount: completeCount };
      })
    );

    // task summary
    const allTasks = await Task.countDocuments(
      req.user.role === "admin" ? {} : { assignedTo: req.user.id }
    );

    const pendingTasks = await Task.countDocuments({
      ...filter,
      status: "pending",
      ...(req.user.role !== "admin" && { assignedTo: req.user.id }),
    });

    const inProgressTasks = await Task.countDocuments({
      ...filter,
      status: "in-progress",
      ...(req.user.role !== "admin" && { assignedTo: req.user.id }),
    });

    const completedTasks = await Task.countDocuments({
      ...filter,
      status: "completed",
      ...(req.user.role !== "admin" && { assignedTo: req.user.id }),
    });

    return res.status(200).json({
      success: true,
      tasks,
      statusSummary: {
        all: allTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (req, res, next) => {
  try {
    const id = req.params?.id || req.params?.taskId;
    if (!id) return next(ErrorHandler(400, "Missing task id"));

    const task = await Task.findById(id).populate(
      "assignedTo",
      "name email profilePicUrl"
    );
    if (!task) return next(ErrorHandler(404, "Task not found"));

    return res.status(200).json({ success: true, task });
  } catch (error) {
    return next(error);
  }
};

const sanitizeTodoList = (list) => {
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => {
      // accept both item.text and legacy item.task
      const rawText = item?.text ?? item?.task ?? "";
      return {
        text: String(rawText).trim(),
        completed: !!item?.completed,
      };
    })
    .filter((i) => i.text.length > 0);
};

export const updateTask = async (req, res, next) => {
  try {
    const id = req.params?.id;
    if (!id) return next(ErrorHandler(400, "Missing task id"));

    const task = await Task.findById(id);
    if (!task) return next(ErrorHandler(404, "Task not found"));

    const oldStatus = task.status;
    const oldAssignees = (task.assignedTo || []).map(String);

    // update fields
    task.title = req.body.title ?? task.title;
    task.description = req.body.description ?? task.description;
    task.priority = req.body.priority ?? task.priority;
    task.dueDate = req.body.dueDate ?? task.dueDate;
    task.tags = req.body.tags ?? task.tags;
    task.status = req.body.status ?? task.status;

    if (req.body.todoCheckList) {
      task.todoCheckList = sanitizeTodoList(req.body.todoCheckList);
    } else {
      task.todoCheckList = sanitizeTodoList(task.todoCheckList);
    }

    if (req.body.attachments !== undefined || req.body.attachment !== undefined) {
      const incoming = req.body.attachments !== undefined ? req.body.attachments : req.body.attachment;
      const raw = normalizeAttachmentsInput(incoming);
      task.attachments = raw.map(mapAttachmentToString).filter(Boolean);
    }

    if (req.body.assignedTo) {
      if (!Array.isArray(req.body.assignedTo)) {
        return next(ErrorHandler(400, "Assigned to must be an array of user ids"));
      }
      task.assignedTo = req.body.assignedTo;
    }

    const updatedTask = await task.save();
    const newAssignees = (updatedTask.assignedTo || []).map(String);

    // LOG: task_completed event (notify admin + assignees)
    if (oldStatus !== "completed" && updatedTask.status === "completed") {
      const admin = await User.findOne({ role: "admin" }).select("_id");
      const targets = [...new Set([...newAssignees, admin?._id ? String(admin._id) : null].filter(Boolean))];
      await createEvent({
        type: "task_completed",
        actor: req.user.id,
        targets,
        task: String(updatedTask._id),
        meta: { title: updatedTask.title },
        io: req.app.locals.io,
      });
    }

    // LOG: task_assigned to newly added assignees
    const newlyAdded = newAssignees.filter((u) => !oldAssignees.includes(u));
    if (newlyAdded.length) {
      await createEvent({
        type: "task_assigned",
        actor: req.user.id,
        targets: newlyAdded,
        task: String(updatedTask._id),
        meta: { title: updatedTask.title },
        io: req.app.locals.io,
      });
    }

    return res.status(200).json({ success: true, task: updatedTask });
  } catch (err) {
    next(err);
  }
};

export const deleteTask = async (req, res, next) => {
  const task = Task.findById(req.params?.id);

  if (!task) {
    next(ErrorHandler(404, "task not found"));
  }

  await task.deleteOne();

  res.status(200).json("task deleted successfully!");
};

export const updateTaskStatus = async (req, res, next) => {
  try {
    const id = req.params?.id;
    if (!id) return next(ErrorHandler(400, "Missing task id"));

    const task = await Task.findById(id);
    if (!task) return next(ErrorHandler(404, "Task not found"));

    const isAssigned = task.assignedTo.some(
      (userId) => userId.toString() === req.user.id.toString()
    );

    if (!isAssigned && req.user.role !== "admin") {
      next(ErrorHandler(401, "unauthorized user"));
    }

    task.status = req.body.status || task.status;

    if (task.status === "completed") {
      task.todoCheckList.forEach((item) => (item.completed = true));
    }

    await task.save();

    return res.status(200).json({ message: "task status updated" });
  } catch (error) {
    next(error);
  }
};

export const updateTodoChecklist = async (req, res, next) => {
  try {
    if (!req.user?.id) return next(ErrorHandler(401, "Unauthorized"));

    const id = req.params?.id;
    if (!id) return next(ErrorHandler(400, "Missing task id"));

    const task = await Task.findById(id);
    if (!task) return next(ErrorHandler(404, "Task not found"));

    // allow if assigned OR admin
    const isAssigned = (task.assignedTo || []).some(
      (u) => String(u) === String(req.user.id)
    );
    if (!isAssigned && req.user.role !== "admin")
      return next(ErrorHandler(403, "Not allowed"));

    const incoming = req.body?.todoCheckList || req.body?.todoChecklist;
    const sanitized = Array.isArray(incoming)
      ? incoming
          .map((item) => ({
            text: String(item?.text ?? item?.task ?? "").trim(),
            completed: !!item?.completed,
          }))
          .filter((i) => i.text.length > 0)
      : task.todoCheckList || [];

    task.todoCheckList = sanitized;

    const total = task.todoCheckList.length;
    const done = task.todoCheckList.filter((i) => i.completed).length;
    task.progress = total > 0 ? Math.round((done / total) * 100) : 0;
    task.status =
      task.progress === 100
        ? "completed"
        : task.progress > 0
        ? "in-progress"
        : "pending";

    const saved = await task.save();
    const populated = await Task.findById(saved._id).populate(
      "assignedTo",
      "name email profilePicUrl profilePicUrl"
    );

    return res
      .status(200)
      .json({ success: true, message: "Checklist updated", task: populated });
  } catch (err) {
    console.error("updateTodoChecklist error:", err);
    next(err);
  }
};

export const getDashboardData = async (req, res, next) => {
  try {
    const totalCount = await Task.countDocuments();
    const pendingTasks = await Task.countDocuments({ status: "pending" });
    const completedTasks = await Task.countDocuments({ status: "completed" });
    const overDueTasks = await Task.countDocuments({
      status: { $ne: "completed" },
      dueDate: { $lt: new Date() },
    });

    const tasksStatus = ["completed", "in-progress", "pending"];

    const taskDistributionRaw = await Task.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const taskDistribution = tasksStatus.reduce((acc, status) => {
      const formattedKey = status.replace(/\s/g, "");

      acc[formattedKey] =
        taskDistributionRaw.find((item) => item._id === status)?.count || 0;

      return acc;
    }, {});

    taskDistribution["All"] = totalCount;

    // replace priority aggregation + object construction with normalized keys
    const taskPriorities = ["low", "medium", "high"];

    const taskPriorityLevelRaw = await Task.aggregate([
      { $group: { _id: { $toLower: "$priority" }, count: { $sum: 1 } } },
    ]);

    const taskPriorityLevel = taskPriorities.reduce((acc, priority) => {
      acc[priority] =
        taskPriorityLevelRaw.find((item) => item._id === priority)?.count || 0;
      return acc;
    }, {});

    const recentTasks = await Task.find()
      .sort({
        createdBy: -1,
      })
      .limit(10)
      .select("title status priority dueDate createdBy");

    res.status(200).json({
      statics: {
        totalCount,
        pendingTasks,
        completedTasks,
        overDueTasks,
      },
      charts: {
        taskDistribution,
        taskPriorityLevel, // <-- camelCase key expected by frontend
      },
      recentTasks,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserDashboardData = async (req, res, next) => {
  try {
    const userId = req.user.id;
    if (!userId) return next(ErrorHandler(401, "Unauthorized"));

    const userObjId = new mongoose.Types.ObjectId(userId);

    const totalCount = await Task.countDocuments({ assignedTo: userObjId });
    const pendingTask = await Task.countDocuments({
      assignedTo: userObjId,
      status: "pending",
    });
    const completedTask = await Task.countDocuments({
      assignedTo: userObjId,
      status: "completed",
    });
    const overDueTask = await Task.countDocuments({
      assignedTo: userObjId,
      status: { $ne: "completed" },
      dueDate: { $lt: new Date() },
    });

    const tasksStatus = ["completed", "in-progress", "pending"];

    const taskDistributionRaw = await Task.aggregate([
      { $match: { assignedTo: userObjId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const taskDistribution = tasksStatus.reduce((acc, status) => {
      const formattedKey = status.replace(/\s/g, "");
      acc[formattedKey] =
        taskDistributionRaw.find((item) => item._id === status)?.count || 0;
      return acc;
    }, {});
    taskDistribution["All"] = totalCount;

    // normalize priority to lowercase in aggregation
    const taskPriorities = ["low", "medium", "high"];
    const taskPriorityLevelRaw = await Task.aggregate([
      { $match: { assignedTo: userObjId } },
      { $group: { _id: { $toLower: "$priority" }, count: { $sum: 1 } } },
    ]);

    const taskPriorityLevel = taskPriorities.reduce((acc, priority) => {
      acc[priority] =
        taskPriorityLevelRaw.find((item) => item._id === priority)?.count || 0;
      return acc;
    }, {});

    const recentTasks = await Task.find({ assignedTo: userObjId })
      .sort({ createdBy: -1 })
      .limit(10)
      .select("title status priority dueDate createdBy");

    return res.status(200).json({
      statics: { totalCount, pendingTask, completedTask, overDueTask },
      charts: { taskDistribution, taskPriorityLevel },
      recentTasks,
    });
  } catch (error) {
    next(error);
  }
};
