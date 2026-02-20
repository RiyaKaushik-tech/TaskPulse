# ⚡ Quick Start Guide - 5 Minutes to AI Features

## 🎯 **Goal:** Get AI features working in 5 minutes

---

## ✅ **Step 1: Get API Keys (3 minutes)**

### **Start with GROQ (Most Important)**
1. Open: https://console.groq.com/keys
2. Click "Sign Up" (use Google/Email)
3. Click "Create API Key" 
4. Copy the key (starts with `gsk_...`)

### **Get Google Gemini**
1. Open: https://makersuite.google.com/app/apikey
2. Sign in with Google
3. Click "Create API Key"
4. Copy the key (starts with `AIzaSy...`)

### **Get Hugging Face**
1. Open: https://huggingface.co/settings/tokens
2. Sign up
3. Click "New token" → Select "Read"
4. Copy the key (starts with `hf_...`)

### **Get Cohere**
1. Open: https://dashboard.cohere.com/api-keys
2. Sign up
3. Copy the trial API key shown

---

## ✅ **Step 2: Configure Backend (1 minute)**

```bash
# Navigate to backend folder
cd backend

# Copy example file
cp .env.example .env

# Open .env file and paste your keys
```

**Edit `.env` file:**
```env
GROQ_API_KEY=gsk_your_key_here
GEMINI_API_KEY=AIzaSy_your_key_here
HUGGINGFACE_API_KEY=hf_your_key_here
COHERE_API_KEY=your_key_here
```

---

## ✅ **Step 3: Start Backend (1 minute)**

```bash
# Make sure you're in backend folder
cd backend

# Start the server
npm start
```

**You should see:**
```
🚀 Server is running on port 5000
🤖 Initializing AI Services...
✅ Groq client initialized
✅ Gemini client initialized
✅ Hugging Face client initialized
✅ Cohere client initialized
✅ 4/4 AI services configured
```

---

## ✅ **Step 4: Test Features (30 seconds)**

### **1. Task Suggestions**
1. Open browser: `https://task-pulse-jo23.onrender.com`
2. Go to "Create Task" page
3. Find purple "AI Task Assistant" box
4. Type: "implement user authentication"
5. Click "Generate"
6. 🎉 See AI suggestions!

### **2. Smart Search**
1. Go to "Dashboard"
2. Find "AI Semantic Search" box
3. Type: "urgent bugs"
4. Click "Search"
5. 🎉 See relevant tasks!

### **3. Report Generator**
1. Still on Dashboard
2. Find "AI Report Generator" box
3. Click "Generate AI Report"
4. 🎉 See comprehensive report!

---

## 🎉 **Done! You're Ready!**

### **All 8 Features Now Available:**

✅ AI Task Suggestions - Create Task page
✅ AI Subtask Generator - Create Task page  
✅ AI Smart Search - Dashboard
✅ AI Report Generator - Dashboard
✅ AI Priority Analysis - API endpoint
✅ AI Performance Insights - API endpoint
✅ AI Comment Summarizer - Task Details page
✅ AI Daily Digest - API endpoint

---

## 🚨 **Troubleshooting**

### **Problem: "AI suggestions are currently unavailable"**
**Solution:**
```bash
# Check .env file has keys
cat backend/.env | grep API_KEY

# Restart backend
cd backend
npm start
```

### **Problem: Backend won't start**
**Solution:**
```bash
# Check if packages installed
cd backend
npm install

# Check Node version (need 16+)
node --version
```

### **Problem: "Authentication error"**
**Solution:**
- Make sure you're logged in
- Check token in localStorage
- Try logging out and back in

---

## 📚 **Next Steps**

1. ✅ **Read full guide:** [AI_FEATURES_GUIDE.md](AI_FEATURES_GUIDE.md)
2. ✅ **Customize prompts:** Edit `backend/utils/aiServices.js`
3. ✅ **Add more features:** Follow existing patterns
4. ✅ **Deploy to production:** Get production API keys

---

## 🎯 **Tips for Best Experience**

### **Task Suggestions:**
- Be specific: "implement OAuth login with Google"
- Include context: "create responsive navbar with dropdown"
- Mention tech: "build REST API using Express"

### **Smart Search:**
- Use natural language: "tasks about database issues"
- Be descriptive: "urgent frontend bugs"
- Try synonyms: "security problems" vs "vulnerabilities"

### **Reports:**
- Generate weekly for best insights
- Use filters to focus on specific areas
- Export and share with team

---

## 📊 **Verify Everything Works**

### **Quick Test Checklist:**

```bash
# 1. Check AI status endpoint
curl https://taskpulse-backend-jaye.onrender.com/api/ai/status

# Should return:
{
  "success": true,
  "data": {
    "services": {
      "groq": true,
      "gemini": true,
      "huggingface": true,
      "cohere": true
    }
  }
}
```

### **Frontend Test:**
- [ ] Create Task page loads without errors
- [ ] AI Task Assistant box appears
- [ ] Dashboard shows Smart Search and Report Generator
- [ ] Task Details page shows Comment Summarizer

---

## 💡 **Common Questions**

**Q: Do I need all 4 API keys?**
A: No! Each feature works independently. Start with GROQ for task suggestions.

**Q: Are these really free?**
A: Yes! All have generous free tiers. No credit card needed.

**Q: How long do API keys last?**
A: Indefinitely, unless you delete them or they're compromised.

**Q: Can I use in production?**
A: Yes! Free tiers are suitable for small teams. Upgrade if needed.

**Q: What if I hit rate limits?**
A: Free tiers are generous. If you hit limits, wait or upgrade to paid tier.

---

## 🎉 **You're All Set!**

**Enjoy your AI-powered task management system!** 🚀

For detailed documentation, see:
- **[AI_FEATURES_GUIDE.md](AI_FEATURES_GUIDE.md)** - Complete user guide
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Technical details

**Questions?** Check the troubleshooting sections in the guides above.

---

**Total Time:** ~5 minutes ⏱️  
**Cost:** $0.00 💰  
**Value:** Priceless! 🎁
