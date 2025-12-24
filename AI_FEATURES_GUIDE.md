# 🤖 AI Features Documentation - TaskPulse

## Overview

TaskPulse now includes **8 powerful AI features** using **4 different free AI APIs**. All features work independently - if one API key is missing, only that specific feature will be disabled.

---

## 🚀 Quick Setup

### 1. Get Your Free API Keys (5 minutes)

#### **GROQ API** (Fastest, Most Important)
- **Visit:** https://console.groq.com/keys
- **Sign up:** Free account, no credit card
- **Create API key:** Click "Create API Key"
- **Free Tier:** 14,400 requests/day (plenty for development)
- **Used for:** Task suggestions, subtask generation

#### **Google Gemini API**
- **Visit:** https://makersuite.google.com/app/apikey
- **Sign in:** With Google account
- **Create API key:** Click "Get API Key"
- **Free Tier:** 1,500 requests/day
- **Used for:** Report generation, priority analysis, insights

#### **Hugging Face API**
- **Visit:** https://huggingface.co/settings/tokens
- **Sign up:** Free account
- **Create token:** Click "New token" → Choose "Read" access
- **Free Tier:** 30,000 characters/month
- **Used for:** Semantic search, text embeddings

#### **Cohere API**
- **Visit:** https://dashboard.cohere.com/api-keys
- **Sign up:** Free trial account
- **Create API key:** Automatically provided
- **Free Tier:** 100 calls/minute
- **Used for:** Comment summarization, daily digests

### 2. Configure Environment Variables

```bash
cd backend
cp .env.example .env
```

Edit `.env` file and add your API keys:

```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxx
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxx
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxx
COHERE_API_KEY=xxxxxxxxxxxxxxxxxxxx
```

### 3. Restart Your Backend

```bash
npm start
```

You should see:
```
🤖 Initializing AI Services...
✅ Groq client initialized
✅ Gemini client initialized
✅ Hugging Face client initialized
✅ Cohere client initialized
✅ 4/4 AI services configured
```

---

## 📚 Features Guide

### 1. **AI Task Suggestions** (GROQ)
**Location:** Create Task page

**What it does:**
- Type a brief task description (e.g., "create login page")
- AI generates complete task with:
  - Professional title
  - Detailed description
  - Relevant tags
  - Priority recommendation
  - Time estimate

**How to use:**
1. Go to "Create Task" page
2. Find the purple "AI Task Assistant" box at the top
3. Type your brief description
4. Click "Generate"
5. Review suggestions in modal
6. Click "Apply Suggestions" to auto-fill the form

**Example:**
```
Input: "implement user authentication"

AI Output:
- Title: "Implement User Authentication System"
- Description: "Develop a secure authentication system with login, 
  registration, and session management. Include password hashing and 
  JWT token-based authentication."
- Tags: ["authentication", "security", "backend"]
- Priority: High
- Estimated Time: 8 hours
```

---

### 2. **AI Subtask Generator** (GROQ)
**Location:** Create Task page → Checklist section

**What it does:**
- Breaks down complex tasks into 3-6 actionable steps
- Creates organized checklist items
- Logical task decomposition

**How to use:**
1. Enter task title and description
2. Scroll to "TODO Checklist" section
3. Click "Generate Subtasks" button
4. Review and edit generated subtasks
5. Click "Apply" to add to checklist

**Example:**
```
Task: "Implement User Authentication System"

Generated Subtasks:
1. Set up database schema for users
2. Create registration API endpoint
3. Implement password hashing with bcrypt
4. Build JWT token generation logic
5. Create login API endpoint
6. Add authentication middleware
```

---

### 3. **AI Smart Search** (Hugging Face)
**Location:** Dashboard page

**What it does:**
- Semantic search - finds tasks by meaning, not just keywords
- Shows similarity score for each result
- Understands natural language queries

**How to use:**
1. Go to Dashboard
2. Find the "AI Semantic Search" box
3. Type your search query (natural language)
4. Click "Search"
5. View results ranked by relevance
6. Click any task to open it

**Example Queries:**
```
- "urgent database problems" → Finds: "Fix DB connection timeout"
- "frontend bugs" → Finds: "Button alignment issue", "CSS not loading"
- "security issues" → Finds: "Update dependencies", "Fix XSS vulnerability"
```

---

### 4. **AI Report Generator** (Gemini)
**Location:** Dashboard page

**What it does:**
- Generates comprehensive reports with AI insights
- Analyzes task data and identifies trends
- Provides actionable recommendations

**How to use:**
1. Go to Dashboard
2. Find "AI Report Generator" box
3. Select report type (Weekly/Monthly)
4. Apply filters (optional)
5. Click "Generate AI Report"
6. View/Download/Copy report

**Report Includes:**
- Executive summary
- Task completion metrics
- Priority analysis
- Bottleneck identification
- Performance trends
- Recommendations for improvement

---

### 5. **AI Priority Analysis** (Gemini)
**Endpoint:** `POST /api/ai/analyze-priority`

**What it does:**
- AI recommends task priority based on description and deadline
- Risk assessment for missing deadlines
- Reasoning explanation

**How to use (API):**
```javascript
const response = await axiosInstance.post('/ai/analyze-priority', {
  title: "Fix production bug",
  description: "Critical security vulnerability",
  dueDate: "2025-12-25",
  priority: "medium"
});

// Response:
{
  suggestedPriority: "high",
  riskLevel: "high",
  reasoning: "This is a critical security issue affecting production..."
}
```

---

### 6. **AI Performance Insights** (Gemini)
**Endpoint:** `POST /api/ai/generate-insights`

**What it does:**
- Analyzes user/team performance data
- Identifies strengths and weaknesses
- Provides specific recommendations

**How to use (API):**
```javascript
const response = await axiosInstance.post('/ai/generate-insights', {
  timeRange: "month",
  targetUserId: "user-id" // Optional, admin only
});

// Response includes:
// - Completion rate analysis
// - Time management insights
// - Productivity trends
// - Specific action items
```

---

### 7. **AI Comment Summarizer** (Cohere)
**Location:** Task Details page

**What it does:**
- Summarizes long comment threads
- Extracts key discussion points
- Saves time reading long conversations

**How to use:**
1. Open any task with comments
2. Find "AI Summarize Comments" button
3. Click to generate summary
4. View condensed discussion points
5. Copy summary if needed

**Example:**
```
15 comments summarized to:

"The team discussed implementing OAuth2 authentication. 
John suggested using Passport.js, which Sarah agreed with. 
Mike raised concerns about token expiration, resolved by 
implementing refresh tokens. Final decision: Use Passport.js 
with JWT and 7-day refresh tokens."
```

---

### 8. **AI Daily Digest** (Cohere)
**Endpoint:** `GET /api/ai/daily-digest`

**What it does:**
- Daily summary of all task activities
- Highlights important updates
- Quick overview of day's progress

**How to use (API):**
```javascript
const response = await axiosInstance.get('/ai/daily-digest');

// Response:
{
  digest: "Today's highlights: 5 tasks completed, 3 new tasks created, 
          2 high-priority items updated...",
  updateCount: 10,
  date: "December 24, 2025"
}
```

---

## 🛠️ API Endpoints Reference

### Task Suggestions
```
POST /api/ai/suggest-task
Body: { userInput: "brief task description" }
```

### Subtask Generation
```
POST /api/ai/generate-subtasks
Body: { taskTitle: "string", taskDescription: "string" }
```

### Priority Analysis
```
POST /api/ai/analyze-priority
Body: { title: "string", description: "string", dueDate: "date", priority: "string" }
```

### Report Generation
```
POST /api/ai/generate-report
Body: { reportType: "weekly|monthly|custom", filters: { status, priority, userId } }
```

### Performance Insights
```
POST /api/ai/generate-insights
Body: { timeRange: "week|month|quarter", targetUserId: "string" }
```

### Smart Search
```
POST /api/ai/smart-search
Body: { query: "search query", limit: 10 }
```

### Comment Summarization
```
GET /api/ai/summarize-comments/:taskId
```

### Daily Digest
```
GET /api/ai/daily-digest
```

### AI Status Check
```
GET /api/ai/status
```

---

## 🔍 Testing Checklist

### Basic Functionality
- [ ] All API keys configured in `.env`
- [ ] Backend starts without errors
- [ ] AI initialization logs appear on startup
- [ ] `/api/ai/status` returns all services as "available"

### Feature Testing
- [ ] Task suggestions work from Create Task page
- [ ] Subtask generator creates logical checklist items
- [ ] Smart search finds relevant tasks
- [ ] Report generator creates comprehensive reports
- [ ] Comment summarizer condenses discussions
- [ ] All modals open/close properly
- [ ] Loading states display correctly
- [ ] Error messages show when API calls fail

### Edge Cases
- [ ] Works with missing API keys (graceful degradation)
- [ ] Handles empty/invalid input
- [ ] Rate limiting respected
- [ ] Long text inputs handled properly

---

## ⚠️ Troubleshooting

### "AI suggestions are currently unavailable"
**Problem:** API key missing or invalid

**Solution:**
1. Check `.env` file has correct API key
2. Verify no extra spaces in API key
3. Restart backend server
4. Check API key is valid on provider's dashboard

### "Failed to generate suggestions"
**Problem:** Rate limit exceeded or network issue

**Solution:**
1. Check API provider's rate limits
2. Wait a few minutes and try again
3. Check internet connection
4. View backend logs for detailed error

### AI Services Not Initializing
**Problem:** Environment variables not loaded

**Solution:**
```bash
# Ensure .env file exists
ls backend/.env

# Check if dotenv is configured
# In index.js, first line should be:
import 'dotenv/config';

# Restart backend
cd backend
npm start
```

### Search Returns No Results
**Problem:** Tasks don't have embeddings yet

**Solution:**
- Embeddings are generated on-the-fly
- First search may be slow
- Subsequent searches will be faster

---

## 📊 Rate Limits & Costs

| Service | Free Tier | Rate Limit | Enough For |
|---------|-----------|------------|------------|
| **Groq** | 14,400 req/day | 30 req/min | 600 tasks/day |
| **Gemini** | 1,500 req/day | 60 req/min | 100 reports/day |
| **Hugging Face** | 30k chars/month | Varies | 1000 searches/month |
| **Cohere** | Unlimited | 100 req/min | Unlimited summaries |

**💡 All free tiers are generous for development and small teams!**

---

## 🎯 Best Practices

### 1. **Start with GROQ** (Most Impactful)
- Task suggestions save the most time
- Fastest response times
- Most frequently used feature

### 2. **Use Smart Search** for Discovery
- Better than keyword search
- Finds related tasks you might miss
- Natural language queries

### 3. **Generate Reports Weekly**
- Get consistent insights
- Track progress over time
- Share with team

### 4. **Summarize Long Comment Threads**
- Save time on catch-up
- Quick overview of discussions
- Before joining conversation

### 5. **Monitor AI Status**
- Check `/api/ai/status` periodically
- Ensure all services running
- Identify issues early

---

## 🚀 What to Learn Next

### 1. **Understanding the Architecture**
- **Separation of Concerns:** AI logic in `aiServices.js`, business logic in `ai.controller.js`
- **Middleware Pattern:** Authentication via `verifyUser` middleware
- **Error Handling:** Graceful degradation when APIs unavailable

### 2. **Customizing AI Prompts**
- Edit prompts in `backend/utils/aiServices.js`
- Adjust temperature for creativity vs consistency
- Modify response formats to match your needs

### 3. **Adding New AI Features**
- Study existing patterns in `ai.controller.js`
- Create new service functions in `aiServices.js`
- Add routes in `ai.router.js`
- Build frontend components

### 4. **Performance Optimization**
- Cache frequently used embeddings
- Batch API calls when possible
- Implement request queueing for rate limits
- Add Redis for caching AI responses

### 5. **Security Considerations**
- Rate limiting per user (not implemented yet)
- Input sanitization (basic validation in place)
- Cost monitoring for API usage
- Audit logging for AI features

---

## 💡 Production Tips

### Before Going Live:
1. ✅ Replace all `.env` values with production keys
2. ✅ Enable rate limiting middleware
3. ✅ Add monitoring for API costs
4. ✅ Implement caching layer (Redis)
5. ✅ Add analytics for feature usage
6. ✅ Set up error tracking (Sentry)
7. ✅ Create backup plans for API downtime
8. ✅ Document team guidelines for AI usage

### Cost Management:
- Monitor API usage in each dashboard
- Set up billing alerts
- Upgrade to paid tiers if needed
- Implement usage quotas per user

---

## 📧 Support

If you encounter issues:
1. Check backend logs: `backend/logs` or console output
2. Test API keys independently
3. Review error messages in browser console
4. Check API provider status pages

---

## 🎉 Success!

You now have a **production-ready AI-powered task management system** using:
- ✅ 4 different free AI APIs
- ✅ 8 powerful features
- ✅ Beautiful, responsive UI
- ✅ Comprehensive error handling
- ✅ Graceful degradation

**Happy building! 🚀**
