import { ErrorHandler } from "../utils/error.js";
import Task from "../models/task.modal.js";
import mongoose from "mongoose";

export const createTask = async (req, res, next) => {
  try {
    const {
      title,
      description,
      priority,
      dueDate,
      assignedTo = [],
      attachments = [],
      attachment,            // legacy single
      todoCheckList,
      todoChecklist,         // wrong key from frontend
      tags = [],
    } = req.body || {};

    if (!req.user?.id) return next(ErrorHandler(401, "Unauthorized"));
    if (!title) return next(ErrorHandler(400, "Title is required"));

    if (!Array.isArray(assignedTo))
      return next(ErrorHandler(400, "assignedTo must be an array"));

    const assignees = assignedTo.map(id =>
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
      .map(item => ({
        text: String(item?.text ?? item?.task ?? "").trim(),
        completed: !!item?.completed,
      }))
      .filter(i => i.text.length > 0);

    const normPriority = (priority || "medium").toLowerCase();

    const task = await Task.create({
      title,
      description,
      priority: normPriority,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      assignedTo: assignees,
      attachments: Array.isArray(attachments) ? attachments : attachment ? [attachment] : [],
      todoCheckList: normalizedTodo,
      tags: Array.isArray(tags) ? tags : [],
      createdBy: req.user.id,
      status: "pending",
      progress: 0,
    });

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
      filter.title = { $regex: search, $options: 'i' };
    }

    // Filter by tags
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
      if (tagArray.length > 0) {
        filter.tags = { $in: tagArray };
      }
    }

    // Filter by assignedTo user (only for admin)
    if (assignedToUser && mongoose.Types.ObjectId.isValid(assignedToUser)) {
      filter.assignedTo = new mongoose.Types.ObjectId(assignedToUser);
    }

    if (!req.user || !req.user.id)
      return next(ErrorHandler(401, "Unauthorized"));

    let tasks;

    if (req.user.role === "admin") {
      tasks = await Task.find(filter).populate(
        "assignedTo",
        "name email profileImageUrl"
      );
    } else {
      tasks = await Task.find({
        ...filter,
        assignedTo: req.user.id,
      }).populate("assignedTo", "name email profileImageUrl");
    }

    // Apply sorting
    if (sortBy) {
      const order = sortOrder === 'desc' ? -1 : 1;
      if (sortBy === 'createdAt' || sortBy === 'assignedDate') {
        tasks.sort((a, b) => (new Date(a.createdAt) - new Date(b.createdAt)) * order);
      } else if (sortBy === 'dueDate' || sortBy === 'deadline') {
        tasks.sort((a, b) => {
          const dateA = a.dueDate ? new Date(a.dueDate) : new Date('9999-12-31');
          const dateB = b.dueDate ? new Date(b.dueDate) : new Date('9999-12-31');
          return (dateA - dateB) * order;
        });
      }
    }

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
      "name email profileImageUrl"
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

    // update fields
    task.title = req.body.title ?? task.title;
    task.description = req.body.description ?? task.description;
    task.priority = req.body.priority ?? task.priority;
    task.dueDate = req.body.dueDate ?? task.dueDate;
    task.tags = req.body.tags ?? task.tags;

    // If client provided todoCheckList, sanitize and set it.
    if (req.body.todoCheckList) {
      task.todoCheckList = sanitizeTodoList(req.body.todoCheckList);
    } else {
      // Always sanitize existing items to avoid validation errors from legacy data
      task.todoCheckList = sanitizeTodoList(task.todoCheckList);
    }

    task.attachments = req.body.attachment ?? task.attachments;

    if (req.body.assignedTo) {
      if (!Array.isArray(req.body.assignedTo)) {
        return next(
          ErrorHandler(400, "Assigned to must be an array of user ids")
        );
      }
      task.assignedTo = req.body.assignedTo;
    }

    const updatedTask = await task.save();

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
      u => String(u) === String(req.user.id)
    );
    if (!isAssigned && req.user.role !== "admin")
      return next(ErrorHandler(403, "Not allowed"));

    const incoming = req.body?.todoCheckList || req.body?.todoChecklist;
    const sanitized = Array.isArray(incoming)
      ? incoming
          .map(item => ({
            text: String(item?.text ?? item?.task ?? "").trim(),
            completed: !!item?.completed,
          }))
          .filter(i => i.text.length > 0)
      : task.todoCheckList || [];

    task.todoCheckList = sanitized;

    const total = task.todoCheckList.length;
    const done = task.todoCheckList.filter(i => i.completed).length;
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
      "name email profileImageUrl profileImageUrl"
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
    const pendingTask = await Task.countDocuments({ assignedTo: userObjId, status: "pending" });
    const completedTask = await Task.countDocuments({ assignedTo: userObjId, status: "completed" });
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
      acc[formattedKey] = taskDistributionRaw.find((item) => item._id === status)?.count || 0;
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
      acc[priority] = taskPriorityLevelRaw.find((item) => item._id === priority)?.count || 0;
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
