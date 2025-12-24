import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { HfInference } from "@huggingface/inference";
import { CohereClient } from "cohere-ai";
import fetch from "node-fetch";

/**
 * AI SERVICES UTILITY
 * 
 * This file initializes and exports all AI API clients used in TaskPulse.
 * Each service is configured from environment variables and includes error handling.
 * 
 * Services:
 * 1. GROQ - Ultra-fast LLM for real-time task suggestions, auto-completion, tag generation
 * 2. GOOGLE GEMINI - Complex analysis, report generation, insights
 * 3. HUGGING FACE - Semantic search and text embeddings
 * 4. COHERE - Text summarization for comments and updates
 */

// ============================================================
// 1. GROQ - Fast LLM (Llama models)
// ============================================================
let groqClient = null;

export const initGroq = () => {
  if (!process.env.GROQ_API_KEY) {
    console.warn("⚠️ GROQ_API_KEY not found. Task suggestions will be disabled.");
    return null;
  }
  
  if (!groqClient) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
    console.log("✅ Groq client initialized");
  }
  
  return groqClient;
};

/**
 * Generate task suggestions using Groq
 * @param {string} userInput - Brief task description from user
 * @returns {Promise<object>} - Suggested title, description, tags, priority, estimatedTime
 */
export const generateTaskSuggestions = async (userInput) => {
  const client = initGroq();
  if (!client) throw new Error("Groq API not configured");

  const prompt = `You are a task management AI assistant. A user wants to create a task with this brief input: "${userInput}"

Please analyze and provide:
1. A clear, concise title (max 60 characters)
2. A detailed description (2-3 sentences)
3. Suggested tags (3-5 relevant tags)
4. Priority level (low, medium, or high)
5. Estimated time to complete in hours (be realistic)

Respond ONLY with valid JSON in this exact format:
{
  "title": "string",
  "description": "string",
  "tags": ["tag1", "tag2", "tag3"],
  "priority": "low|medium|high",
  "estimatedTimeHours": number
}`;

  const completion = await client.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile", // Fast and accurate
    temperature: 0.7,
    max_tokens: 500,
    response_format: { type: "json_object" },
  });

  return JSON.parse(completion.choices[0].message.content);
};

/**
 * Generate subtask suggestions from a main task
 * @param {string} taskTitle - Main task title
 * @param {string} taskDescription - Task description
 * @returns {Promise<array>} - Array of subtask objects {text, completed}
 */
export const generateSubtasks = async (taskTitle, taskDescription) => {
  const client = initGroq();
  if (!client) throw new Error("Groq API not configured");

  const prompt = `Break down this task into 3-6 actionable subtasks:

Task: ${taskTitle}
Description: ${taskDescription}

Provide subtasks that are:
- Specific and actionable
- In logical order
- Each can be completed independently
- Clear enough for any team member

Respond ONLY with valid JSON:
{
  "subtasks": ["subtask 1", "subtask 2", "subtask 3"]
}`;

  const completion = await client.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile",
    temperature: 0.6,
    max_tokens: 400,
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(completion.choices[0].message.content);
  return result.subtasks.map(text => ({ text, completed: false }));
};

// ============================================================
// 2. GOOGLE GEMINI - Complex Analysis & Reports
// ============================================================
let geminiClient = null;

export const initGemini = () => {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("⚠️ GEMINI_API_KEY not found. Report generation will be disabled.");
    return null;
  }
  
  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log("✅ Gemini client initialized");
  }
  
  return geminiClient;
};

/**
 * Generate a comprehensive report from tasks
 * @param {array} tasks - Array of task objects
 * @param {string} reportType - "weekly", "monthly", "user", "project"
 * @returns {Promise<string>} - Formatted report in markdown
 */
export const generateReport = async (tasks, reportType = "weekly") => {
  const client = initGemini();
  if (!client) throw new Error("Gemini API not configured");

  const model = client.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

  const tasksSummary = tasks.map(t => ({
    title: t.title,
    status: t.status,
    priority: t.priority,
    progress: t.progress,
    dueDate: t.dueDate,
    assignedCount: t.assignedTo?.length || 0,
    tags: t.tags,
  }));

  const prompt = `Generate a professional ${reportType} report for this task management data:

${JSON.stringify(tasksSummary, null, 2)}

Include:
1. Executive Summary (key metrics and highlights)
2. Status Breakdown (pending/in-progress/completed)
3. Priority Analysis
4. Progress Overview
5. Bottlenecks & Concerns (if any)
6. Recommendations for next period

Format as clean markdown with proper headings and bullet points.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
};

/**
 * Analyze task for priority and risk assessment
 * @param {object} taskData - Task object with title, description, dueDate
 * @returns {Promise<object>} - Analysis with suggestedPriority, riskLevel, reasoning
 */
export const analyzeTaskPriority = async (taskData) => {
  const client = initGemini();
  if (!client) throw new Error("Gemini API not configured");

  const model = client.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

  const prompt = `Analyze this task and recommend priority level:

Title: ${taskData.title}
Description: ${taskData.description}
Due Date: ${taskData.dueDate || "Not set"}
Current Priority: ${taskData.priority || "Not set"}

Based on urgency, complexity, and impact, provide:
1. Recommended priority (low/medium/high)
2. Risk level (low/medium/high) - likelihood of missing deadline
3. Brief reasoning (2-3 sentences)

Respond ONLY with valid JSON:
{
  "suggestedPriority": "low|medium|high",
  "riskLevel": "low|medium|high",
  "reasoning": "string"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  
  throw new Error("Failed to parse AI response");
};

/**
 * Generate insights from user/team performance data
 * @param {object} data - Contains tasks, completionRate, avgTime, etc.
 * @returns {Promise<string>} - Insights and recommendations
 */
export const generateInsights = async (data) => {
  const client = initGemini();
  if (!client) throw new Error("Gemini API not configured");

  const model = client.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

  const prompt = `Analyze this task management performance data and provide actionable insights:

${JSON.stringify(data, null, 2)}

Provide:
1. Key performance indicators summary
2. Strengths and positive trends
3. Areas needing improvement
4. Specific actionable recommendations (3-5 items)
5. Predicted bottlenecks to watch

Format as clean, professional text with clear sections.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
};

// ============================================================
// 3. HUGGING FACE - Semantic Search & Embeddings
// ============================================================
let hfClient = null;

export const initHuggingFace = () => {
  if (!process.env.HUGGINGFACE_API_KEY) {
    console.warn("⚠️ HUGGINGFACE_API_KEY not found. Semantic search will be disabled.");
    return null;
  }
  
  if (!hfClient) {
    // Prefer Router base URL to avoid deprecated api-inference.huggingface.co
    try {
      hfClient = new HfInference({
        accessToken: process.env.HUGGINGFACE_API_KEY,
        baseUrl: "https://router.huggingface.co",
      });
    } catch (_) {
      // Fallback to legacy signature (library differences between versions)
      hfClient = new HfInference(process.env.HUGGINGFACE_API_KEY);
    }
    console.log("✅ Hugging Face client initialized (router.huggingface.co)");
  }
  
  return hfClient;
};

/**
 * Generate embeddings for semantic search
 * @param {string} text - Text to embed
 * @returns {Promise<array>} - Embedding vector
 */
export const generateEmbedding = async (text) => {
  const client = initHuggingFace();
  if (!client) throw new Error("Hugging Face API not configured");

  if (typeof text !== "string" || !text.trim()) {
    throw new Error("Embedding input text is required");
  }

  // Use SDK featureExtraction against Router baseUrl configured in initHuggingFace
  const response = await client.featureExtraction({
    model: "sentence-transformers/all-MiniLM-L6-v2",
    inputs: text,
  });

  // Normalize to flat number[] regardless of SDK shape (number[] | number[][])
  let vector = response;
  if (Array.isArray(response) && Array.isArray(response[0])) {
    vector = response[0];
  }
  if (!Array.isArray(vector)) {
    throw new Error("Invalid embedding response shape");
  }
  return vector.map((v) => Number(v));
};

/**
 * Find semantically similar tasks
 * @param {string} query - Search query
 * @param {array} tasks - Array of tasks with embeddings
 * @returns {Promise<array>} - Ranked similar tasks
 */
export const semanticTaskSearch = async (query, tasks) => {
  const queryEmbedding = await generateEmbedding(query);
  
  // Calculate cosine similarity for each task
  const scored = tasks.map(task => {
    if (!task.embedding) return { task, score: 0 };
    
    const similarity = cosineSimilarity(queryEmbedding, task.embedding);
    return { task, score: similarity };
  });
  
  // Sort by similarity score (descending)
  return scored
    .sort((a, b) => b.score - a.score)
    .filter(item => item.score > 0.3) // Threshold for relevance
    .map(item => ({ ...item.task, similarityScore: item.score }));
};

/**
 * Calculate cosine similarity between two vectors
 * @param {array} vecA - First vector
 * @param {array} vecB - Second vector
 * @returns {number} - Similarity score (0-1)
 */
function cosineSimilarity(vecA, vecB) {
  if (!Array.isArray(vecA) || !Array.isArray(vecB)) return 0;
  const len = Math.min(vecA.length, vecB.length);
  if (!len) return 0;
  let dotProduct = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < len; i++) {
    const a = Number(vecA[i]) || 0;
    const b = Number(vecB[i]) || 0;
    dotProduct += a * b;
    magA += a * a;
    magB += b * b;
  }
  const magnitudeA = Math.sqrt(magA);
  const magnitudeB = Math.sqrt(magB);
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
}

// ============================================================
// 4. COHERE - Text Summarization
// ============================================================
let cohereClient = null;

export const initCohere = () => {
  if (!process.env.COHERE_API_KEY) {
    console.warn("⚠️ COHERE_API_KEY not found. Comment summarization will be disabled.");
    return null;
  }
  
  if (!cohereClient) {
    cohereClient = new CohereClient({
      token: process.env.COHERE_API_KEY,
    });
    console.log("✅ Cohere client initialized");
  }
  
  return cohereClient;
};

/**
 * Summarize long comment threads
 * @param {array} comments - Array of comment objects
 * @returns {Promise<string>} - Summary of discussion
 */
export const summarizeComments = async (comments) => {
  const client = initCohere();
  if (!client) throw new Error("Cohere API not configured");

  if (!comments || comments.length === 0) {
    return "No comments to summarize.";
  }

  // Format comments into readable text
  const commentsText = comments
    .map((c, i) => `Comment ${i + 1} by ${c.author?.name || "User"}: ${c.content}`)
    .join("\n\n");

  try {
    const response = await client.summarize({
      text: commentsText,
      length: "medium",
      format: "paragraph",
      model: "summarize-xlarge",
      extractiveness: "medium",
    });

    // Cohere SDK returns { id, summary, ... }
    if (response?.summary) return response.summary;
    // Some SDK versions nest under .summaries[0].text
    if (Array.isArray(response?.summaries) && response.summaries[0]?.text) {
      return response.summaries[0].text;
    }
    // Unexpected shape: fall through to fallback summarization
  } catch (err) {
    console.warn("Cohere summarize failed, using fallback:", err?.message || err);
  }

  // Fallback: simple heuristic summary
  const firstLines = comments
    .map((c) => `- ${c.author?.name || "User"}: ${c.content}`)
    .slice(0, 6)
    .join("\n");
  return `Discussion overview (fallback):\n${firstLines}\n\nSummary: ${comments.length} comments discussed key points above.`;
};

/**
 * Generate daily digest of task updates
 * @param {array} updates - Array of update/activity objects
 * @returns {Promise<string>} - Formatted digest
 */
export const generateDailyDigest = async (updates) => {
  const client = initCohere();
  if (!client) throw new Error("Cohere API not configured");

  if (!updates || updates.length === 0) {
    return "No updates for today.";
  }

  const updatesText = updates
    .map(u => `- ${u.action}: ${u.details}`)
    .join("\n");

  const response = await client.summarize({
    text: updatesText,
    length: "short",
    format: "bullets",
    model: "summarize-xlarge",
  });

  return response.summary;
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Check if AI features are available
 * @returns {object} - Status of each AI service
 */
export const getAIStatus = () => {
  return {
    groq: !!process.env.GROQ_API_KEY,
    gemini: !!process.env.GEMINI_API_KEY,
    huggingface: !!process.env.HUGGINGFACE_API_KEY,
    cohere: !!process.env.COHERE_API_KEY,
  };
};

/**
 * Initialize all AI services at startup
 */
export const initializeAllAIServices = () => {
  console.log("\n🤖 Initializing AI Services...");
  initGroq();
  initGemini();
  initHuggingFace();
  initCohere();
  
  const status = getAIStatus();
  const activeServices = Object.entries(status).filter(([_, active]) => active);
  
  console.log(`✅ ${activeServices.length}/4 AI services configured`);
  if (activeServices.length < 4) {
    const missing = Object.entries(status)
      .filter(([_, active]) => !active)
      .map(([name]) => name.toUpperCase());
    console.log(`⚠️ Missing API keys for: ${missing.join(", ")}`);
  }
  console.log("");
};

export default {
  // Groq functions
  generateTaskSuggestions,
  generateSubtasks,
  
  // Gemini functions
  generateReport,
  analyzeTaskPriority,
  generateInsights,
  
  // Hugging Face functions
  generateEmbedding,
  semanticTaskSearch,
  
  // Cohere functions
  summarizeComments,
  generateDailyDigest,
  
  // Utility
  getAIStatus,
  initializeAllAIServices,
};
