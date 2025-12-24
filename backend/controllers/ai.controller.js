import { ErrorHandler } from "../utils/error.js";
import Task from "../models/task.modal.js";
import Comment from "../models/Comment.modal.js";
import {
  generateTaskSuggestions,
  generateSubtasks,
  generateReport,
  analyzeTaskPriority,
  generateInsights,
  generateEmbedding,
  semanticTaskSearch,
  summarizeComments,
  generateDailyDigest,
  getAIStatus,
} from "../utils/aiServices.js";

/**
 * AI CONTROLLER
 * 
 * Handles all AI-powered features for TaskPulse:
 * 1. Task Suggestions - Auto-generate task details from brief input
 * 2. Subtask Generation - Break down tasks into checklists
 * 3. Smart Search - Semantic search across tasks
 * 4. Report Generation - Weekly/monthly performance reports
 * 5. Priority Analysis - AI-recommended task priority
 * 6. Comment Summarization - Condense long discussions
 * 7. Daily Digests - Summary of updates
 * 8. Performance Insights - Team/user analytics
 */

// ============================================================
// 1. TASK SUGGESTIONS (GROQ)
// ============================================================

/**
 * POST /api/ai/suggest-task
 * Generate complete task details from brief user input
 */
export const suggestTask = async (req, res, next) => {
  try {
    const { userInput } = req.body;

    if (!userInput || userInput.trim().length < 3) {
      return next(ErrorHandler(400, "Please provide a task description (min 3 characters)"));
    }

    // Rate limiting check - prevent abuse
    if (userInput.length > 500) {
      return next(ErrorHandler(400, "Input too long. Please keep it under 500 characters."));
    }

    const suggestions = await generateTaskSuggestions(userInput);

    res.status(200).json({
      success: true,
      message: "Task suggestions generated",
      data: suggestions,
    });
  } catch (error) {
    console.error("Error in suggestTask:", error);
    
    if (error.message.includes("not configured")) {
      return next(ErrorHandler(503, "AI task suggestions are currently unavailable. Please check API configuration."));
    }
    
    return next(ErrorHandler(500, "Failed to generate task suggestions"));
  }
};

/**
 * POST /api/ai/generate-subtasks
 * Generate subtask checklist from main task
 */
export const generateSubtasksList = async (req, res, next) => {
  try {
    const { taskTitle, taskDescription } = req.body;

    if (!taskTitle) {
      return next(ErrorHandler(400, "Task title is required"));
    }

    const subtasks = await generateSubtasks(
      taskTitle,
      taskDescription || "No description provided"
    );

    res.status(200).json({
      success: true,
      message: "Subtasks generated",
      data: { subtasks },
    });
  } catch (error) {
    console.error("Error in generateSubtasksList:", error);
    
    if (error.message.includes("not configured")) {
      return next(ErrorHandler(503, "AI subtask generation is currently unavailable"));
    }
    
    return next(ErrorHandler(500, "Failed to generate subtasks"));
  }
};

// ============================================================
// 2. PRIORITY ANALYSIS (GEMINI)
// ============================================================

/**
 * POST /api/ai/analyze-priority
 * Get AI recommendation for task priority and risk assessment
 */
export const analyzePriority = async (req, res, next) => {
  try {
    const { title, description, dueDate, priority } = req.body;

    if (!title) {
      return next(ErrorHandler(400, "Task title is required for analysis"));
    }

    const analysis = await analyzeTaskPriority({
      title,
      description: description || "",
      dueDate,
      priority,
    });

    res.status(200).json({
      success: true,
      message: "Priority analysis completed",
      data: analysis,
    });
  } catch (error) {
    console.error("Error in analyzePriority:", error);
    
    if (error.message.includes("not configured")) {
      return next(ErrorHandler(503, "AI priority analysis is currently unavailable"));
    }
    
    return next(ErrorHandler(500, "Failed to analyze task priority"));
  }
};

// ============================================================
// 3. REPORT GENERATION (GEMINI)
// ============================================================

/**
 * POST /api/ai/generate-report
 * Generate comprehensive report from tasks
 */
export const createReport = async (req, res, next) => {
  try {
    const { reportType = "weekly", filters = {} } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return next(ErrorHandler(401, "Unauthorized"));
    }

    // Build query based on filters
    const query = {};
    
    // Filter by date range
    if (reportType === "weekly") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      query.createdAt = { $gte: weekAgo };
    } else if (reportType === "monthly") {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      query.createdAt = { $gte: monthAgo };
    }

    // Filter by user if specified
    if (filters.userId) {
      query.$or = [
        { createdBy: filters.userId },
        { assignedTo: filters.userId }
      ];
    } else if (req.user.role !== "admin") {
      // Non-admin users can only see their own reports
      query.$or = [
        { createdBy: userId },
        { assignedTo: userId }
      ];
    }

    // Filter by status
    if (filters.status) {
      query.status = filters.status;
    }

    // Filter by priority
    if (filters.priority) {
      query.priority = filters.priority;
    }

    const tasks = await Task.find(query)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .lean();

    if (tasks.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No tasks found for report generation",
        data: { report: "No tasks available in the specified period." },
      });
    }

    // Generate simple report (no external AI dependency)
    const report = generateSimpleReport(tasks, reportType);

    res.status(200).json({
      success: true,
      message: "Report generated successfully",
      data: {
        report,
        taskCount: tasks.length,
        reportType,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error in createReport:", error);
    return next(ErrorHandler(500, "Failed to generate report"));
  }
};

/**
 * POST /api/ai/generate-insights
 * Generate performance insights and recommendations
 */
export const createInsights = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { targetUserId, timeRange = "month" } = req.body;

    if (!userId) {
      return next(ErrorHandler(401, "Unauthorized"));
    }

    // Determine target user (admin can analyze anyone, others only themselves)
    const analyzeUserId = req.user.role === "admin" && targetUserId 
      ? targetUserId 
      : userId;

    // Calculate date range
    const dateLimit = new Date();
    if (timeRange === "week") {
      dateLimit.setDate(dateLimit.getDate() - 7);
    } else if (timeRange === "month") {
      dateLimit.setMonth(dateLimit.getMonth() - 1);
    } else {
      dateLimit.setMonth(dateLimit.getMonth() - 3); // quarter
    }

    // Fetch tasks
    const tasks = await Task.find({
      $or: [
        { createdBy: analyzeUserId },
        { assignedTo: analyzeUserId }
      ],
      createdAt: { $gte: dateLimit }
    }).lean();

    // Calculate metrics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === "completed").length;
    const inProgressTasks = tasks.filter(t => t.status === "in-progress").length;
    const pendingTasks = tasks.filter(t => t.status === "pending").length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : 0;

    // Calculate average completion time
    const completedWithTime = tasks.filter(t => 
      t.status === "completed" && t.createdAt && t.updatedAt
    );
    const avgCompletionHours = completedWithTime.length > 0
      ? completedWithTime.reduce((sum, t) => {
          const hours = (new Date(t.updatedAt) - new Date(t.createdAt)) / (1000 * 60 * 60);
          return sum + hours;
        }, 0) / completedWithTime.length
      : 0;

    // Priority distribution
    const highPriority = tasks.filter(t => t.priority === "high").length;
    const mediumPriority = tasks.filter(t => t.priority === "medium").length;
    const lowPriority = tasks.filter(t => t.priority === "low").length;

    const performanceData = {
      timeRange,
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      completionRate: parseFloat(completionRate),
      avgCompletionHours: Math.round(avgCompletionHours * 10) / 10,
      priorityDistribution: {
        high: highPriority,
        medium: mediumPriority,
        low: lowPriority,
      },
      taskTrends: tasks.map(t => ({
        title: t.title,
        status: t.status,
        priority: t.priority,
        progress: t.progress,
      })),
    };

    const insights = await generateInsights(performanceData);

    res.status(200).json({
      success: true,
      message: "Insights generated successfully",
      data: {
        insights,
        metrics: performanceData,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error in createInsights:", error);
    
    if (error.message.includes("not configured")) {
      return next(ErrorHandler(503, "AI insights generation is currently unavailable"));
    }
    
    return next(ErrorHandler(500, "Failed to generate insights"));
  }
};

// ============================================================
// 4. SEMANTIC SEARCH (HUGGING FACE)
// ============================================================

/**
 * POST /api/ai/smart-search
 * Search tasks by meaning, not just keywords
 */
export const smartSearch = async (req, res, next) => {
  try {
    const { query, limit = 10 } = req.body;

    if (!query || String(query).trim().length < 2) {
      return next(ErrorHandler(400, "Search query is required (min 2 characters)"));
    }
    const userId = req.user?.id;

    if (!userId) {
      return next(ErrorHandler(401, "Unauthorized"));
    }

    if (!query || query.trim().length < 2) {
      return next(ErrorHandler(400, "Search query must be at least 2 characters"));
    }

    // Fetch tasks user has access to
    const accessQuery = req.user.role === "admin"
      ? {} // Admin sees all
      : {
          $or: [
            { createdBy: userId },
            { assignedTo: userId }
          ]
        };

    const tasks = await Task.find(accessQuery)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .limit(100) // Limit to avoid processing too many tasks
      .lean();

    if (tasks.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No tasks available for search",
        data: { results: [] },
      });
    }

    // Keyword-based search (no external embedding dependency)
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(Boolean);
    
    const results = tasks
      .map(task => {
        const title = (task.title || "").toLowerCase();
        const desc = (task.description || "").toLowerCase();
        const tags = (task.tags || []).map(t => t.toLowerCase()).join(" ");
        const text = `${title} ${desc} ${tags}`;
        
        // Calculate match score
        let score = 0;
        if (title.includes(queryLower)) score += 10;
        if (desc.includes(queryLower)) score += 5;
        if (tags.includes(queryLower)) score += 7;
        
        // Bonus for individual word matches
        queryWords.forEach(word => {
          if (title.includes(word)) score += 3;
          if (desc.includes(word)) score += 2;
          if (tags.includes(word)) score += 2;
        });
        
        return { task, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => ({
        ...item.task,
        similarityScore: Math.min(item.score / 15, 1) // Normalize to 0-1
      }));

    res.status(200).json({
      success: true,
      message: "Search completed",
      data: {
        results: results.slice(0, limit),
        totalResults: results.length,
        query,
      },
    });
  } catch (error) {
    console.error("Error in smartSearch:", error);
    
    if (error.message.includes("not configured")) {
      return next(ErrorHandler(503, "AI smart search is currently unavailable"));
    }
    
    return next(ErrorHandler(500, error.message || "Failed to perform smart search"));
  }
};

// ============================================================
// 5. COMMENT SUMMARIZATION (COHERE)
// ============================================================

/**
 * GET /api/ai/summarize-comments/:taskId
 * Summarize all comments in a task thread
 */
export const summarizeTaskComments = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return next(ErrorHandler(401, "Unauthorized"));
    }

    // Check if task exists and user has access
    const task = await Task.findById(taskId);
    if (!task) {
      return next(ErrorHandler(404, "Task not found"));
    }

    // Check access permissions
    const hasAccess = req.user.role === "admin" ||
      task.createdBy.toString() === userId ||
      task.assignedTo.some(id => id.toString() === userId);

    if (!hasAccess) {
      return next(ErrorHandler(403, "You don't have access to this task"));
    }

    // Fetch comments (match schema: task + author)
    const comments = await Comment.find({ task: taskId, isDeleted: false })
      .populate("author", "name email")
      .sort({ createdAt: 1 })
      .lean();

    if (comments.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No comments to summarize",
        data: { summary: "This task has no comments yet.", commentCount: 0, taskId },
      });
    }

    const summary = await summarizeComments(comments);

    res.status(200).json({
      success: true,
      message: "Comments summarized successfully",
      data: {
        summary,
        commentCount: comments.length,
        taskId,
      },
    });
  } catch (error) {
    console.error("Error in summarizeTaskComments:", error);
    
    if (error.message.includes("not configured")) {
      return next(ErrorHandler(503, "AI comment summarization is currently unavailable"));
    }
    
    return next(ErrorHandler(500, "Failed to summarize comments"));
  }
};

/**
 * GET /api/ai/daily-digest
 * Get daily summary of all task updates and activities
 */
export const getDailyDigest = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return next(ErrorHandler(401, "Unauthorized"));
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch today's activities (tasks created/updated)
    const query = {
      $or: [
        { createdBy: userId },
        { assignedTo: userId }
      ],
      updatedAt: { $gte: today, $lt: tomorrow }
    };

    const tasks = await Task.find(query)
      .populate("assignedTo", "name")
      .populate("createdBy", "name")
      .sort({ updatedAt: -1 })
      .lean();

    if (tasks.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No activity today",
        data: { digest: "No task updates for today." },
      });
    }

    // Format updates for digest
    const updates = tasks.map(task => ({
      action: task.createdAt.toDateString() === today.toDateString() 
        ? "Task Created" 
        : "Task Updated",
      details: `${task.title} - Status: ${task.status}, Priority: ${task.priority}`,
    }));

    const digest = await generateDailyDigest(updates);

    res.status(200).json({
      success: true,
      message: "Daily digest generated",
      data: {
        digest,
        updateCount: tasks.length,
        date: today.toDateString(),
      },
    });
  } catch (error) {
    console.error("Error in getDailyDigest:", error);
    
    if (error.message.includes("not configured")) {
      return next(ErrorHandler(503, "AI daily digest is currently unavailable"));
    }
    
    return next(ErrorHandler(500, "Failed to generate daily digest"));
  }
};

// ============================================================
// 6. AI STATUS & HEALTH CHECK
// ============================================================

/**
 * GET /api/ai/status
 * Check which AI services are available
 */
export const checkAIStatus = async (req, res, next) => {
  try {
    const status = getAIStatus();
    
    const features = {
      taskSuggestions: status.groq ? "available" : "unavailable",
      subtaskGeneration: status.groq ? "available" : "unavailable",
      reportGeneration: status.gemini ? "available" : "unavailable",
      priorityAnalysis: status.gemini ? "available" : "unavailable",
      performanceInsights: status.gemini ? "available" : "unavailable",
      smartSearch: status.huggingface ? "available" : "unavailable",
      commentSummarization: status.cohere ? "available" : "unavailable",
      dailyDigest: status.cohere ? "available" : "unavailable",
    };

    const activeCount = Object.values(status).filter(Boolean).length;
    const featureCount = Object.values(features).filter(f => f === "available").length;

    res.status(200).json({
      success: true,
      message: "AI status retrieved",
      data: {
        services: status,
        features,
        summary: {
          activeServices: `${activeCount}/4`,
          availableFeatures: `${featureCount}/8`,
          status: activeCount === 4 ? "fully operational" : activeCount > 0 ? "partial" : "offline",
        },
      },
    });
  } catch (error) {
    console.error("Error in checkAIStatus:", error);
    return next(ErrorHandler(500, "Failed to check AI status"));
  }
};

// Export all controller functions
/**
 * Simple report generator (no external AI dependency)
 */
function generateSimpleReport(tasks, reportType = "weekly") {
  const now = new Date();
  const statusCounts = { pending: 0, "in-progress": 0, completed: 0 };
  const priorityCounts = { low: 0, medium: 0, high: 0 };
  let overdueTasks = 0;
  let completedTasks = 0;

  tasks.forEach(task => {
    statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
    priorityCounts[task.priority] = (priorityCounts[task.priority] || 0) + 1;
    if (task.status === "completed") completedTasks++;
    if (task.dueDate && new Date(task.dueDate) < now && task.status !== "completed") {
      overdueTasks++;
    }
  });

  const completionRate = tasks.length > 0 ? ((completedTasks / tasks.length) * 100).toFixed(1) : 0;

  return `# ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Task Report

**Generated:** ${now.toLocaleDateString()} ${now.toLocaleTimeString()}

## Executive Summary
- **Total Tasks:** ${tasks.length}
- **Completed:** ${completedTasks} (${completionRate}%)
- **Overdue:** ${overdueTasks}
- **Report Type:** ${reportType}

## Status Breakdown
- **Pending:** ${statusCounts.pending}
- **In Progress:** ${statusCounts["in-progress"]}
- **Completed:** ${statusCounts.completed}

## Priority Distribution
- **High Priority:** ${priorityCounts.high}
- **Medium Priority:** ${priorityCounts.medium}
- **Low Priority:** ${priorityCounts.low}

## Key Metrics
- **Completion Rate:** ${completionRate}%
- **Pending Tasks:** ${statusCounts.pending}
- **Overdue Tasks:** ${overdueTasks}

## Recommendations
${completionRate < 50 ? "- Focus on completing more tasks to improve completion rate\n" : ""}${overdueTasks > 0 ? "- Address overdue tasks immediately\n" : ""}${priorityCounts.high > 5 ? "- Consider prioritizing high-priority tasks\n" : ""}${statusCounts.pending > tasks.length * 0.5 ? "- Start working on pending tasks to reduce backlog\n" : "- Great progress! Keep maintaining this pace!\n"}
---
*Report generated by TaskPulse*`;
}

export default {
  suggestTask,
  generateSubtasksList,
  analyzePriority,
  createReport,
  createInsights,
  smartSearch,
  summarizeTaskComments,
  getDailyDigest,
  checkAIStatus,
};
