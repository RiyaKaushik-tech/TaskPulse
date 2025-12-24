import express from "express";
import {
  suggestTask,
  generateSubtasksList,
  analyzePriority,
  createReport,
  createInsights,
  smartSearch,
  summarizeTaskComments,
  getDailyDigest,
  checkAIStatus,
} from "../controllers/ai.controller.js";
import { verifyUser } from "../utils/verifyUser.js";

const router = express.Router();

/**
 * AI ROUTES
 * 
 * All routes require authentication via verifyUser middleware
 * 
 * GROQ-powered routes (fast, real-time):
 * - POST /suggest-task - Generate task details from brief input
 * - POST /generate-subtasks - Create subtask checklist
 * 
 * GEMINI-powered routes (complex analysis):
 * - POST /analyze-priority - AI priority recommendation
 * - POST /generate-report - Weekly/monthly reports
 * - POST /generate-insights - Performance analytics
 * 
 * HUGGINGFACE-powered routes (semantic search):
 * - POST /smart-search - Search tasks by meaning
 * 
 * COHERE-powered routes (summarization):
 * - GET /summarize-comments/:taskId - Summarize task discussions
 * - GET /daily-digest - Daily activity summary
 * 
 * UTILITY routes:
 * - GET /status - Check AI service availability
 */

// ============================================================
// GROQ ROUTES - Fast Task Intelligence
// ============================================================

// Generate complete task from brief input
router.post("/suggest-task", verifyUser, suggestTask);

// Generate subtask checklist
router.post("/generate-subtasks", verifyUser, generateSubtasksList);

// ============================================================
// GEMINI ROUTES - Complex Analysis & Reports
// ============================================================

// Analyze task priority with AI
router.post("/analyze-priority", verifyUser, analyzePriority);

// Generate comprehensive reports
router.post("/generate-report", verifyUser, createReport);

// Generate performance insights
router.post("/generate-insights", verifyUser, createInsights);

// ============================================================
// HUGGING FACE ROUTES - Semantic Search
// ============================================================

// Smart semantic search
router.post("/smart-search", verifyUser, smartSearch);

// ============================================================
// COHERE ROUTES - Summarization
// ============================================================

// Summarize task comments
router.get("/summarize-comments/:taskId", verifyUser, summarizeTaskComments);

// Get daily digest of activities
router.get("/daily-digest", verifyUser, getDailyDigest);

// ============================================================
// UTILITY ROUTES
// ============================================================

// Check AI service status
router.get("/status", verifyUser, checkAIStatus);

export default router;
