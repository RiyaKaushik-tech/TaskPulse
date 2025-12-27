# 🚀 Sync_Solution — Link up now
AI-powered task management with Groq, Google Gemini, and Cohere. Includes JWT auth, RBAC, real-time notifications, attendance tracking, dark/light themes, and 8 AI-assisted tasking features.

![Status](https://img.shields.io/badge/status-production%20ready-brightgreen)
![Node](https://img.shields.io/badge/node-18%2B-green)
![React](https://img.shields.io/badge/react-18-blue)
![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Highlights
- AI: Task suggestions, subtask generation, smart search, reports, priority analysis, performance insights, comment summarization, daily digest.
- Core: JWT auth, RBAC (Admin/User), Socket.io notifications, responsive UI, tasks + subtasks, team comments, attendance tracking.
- UX: Dark/Light/System theme with persisted preference and smooth transitions.

## ⚡ Quick Start (5 min)

**Prereqs:** Node 18+, MongoDB (local/Atlas), npm or bun.

```bash
git clone <your-repo-url>
cd TaskPulse

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Environment
```bash
# Backend
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
MONGO_URI=mongodb://localhost:27017/sync_solution
PORT=5000
JWT_SECRET=your-secret
FRONTEND_URL=http://localhost:5173

# AI keys
GROQ_API_KEY=gsk_your_key
GEMINI_API_KEY=AIzaSy_your_key
COHERE_API_KEY=your_key

# Optional Clerk
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
```

### Run
```bash
# Backend
cd backend
npm start

# Frontend
cd ../frontend
npm run dev
```
Open: http://localhost:5173

## 🛠 Tech Stack
- Frontend: React 18, Vite, TailwindCSS, Redux Toolkit, Axios, Socket.io
- Backend: Node.js, Express, MongoDB/Mongoose, JWT, Socket.io
- AI: Groq, Google Gemini, Cohere

## 📁 Structure (brief)
```
Sync_Solution/
├─ backend/
│  ├─ controllers/ (includes ai.controller.js)
│  ├─ routes/ (includes ai.router.js)
│  ├─ utils/ (aiServices.js, verifyUser, error handlers)
│  ├─ models/ (user, task, attendance)
│  └─ index.js
└─ frontend/
   └─ src/
      ├─ components/ (AI* components, notifications, cards)
      ├─ pages/ (admin, users, auth)
      ├─ redux/ (slices for user, theme)
      └─ App.jsx
```

## 🚀 Deployment
- **Frontend:** Vercel (Vite/React auto-detect). Set env `VITE_API_BASE_URL=https://your-backend`.
- **Backend:** Railway (recommended) or Render.
  - Env: `MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL`, `GROQ_API_KEY`, `GEMINI_API_KEY`, `COHERE_API_KEY`, `NODE_ENV=production`.

## 🔑 Key API Endpoints
```
# Auth
POST /api/auth/signUp
POST /api/auth/signIn
POST /api/auth/logout

# AI (protected)
POST /api/ai/suggest-task
POST /api/ai/generate-subtasks
POST /api/ai/smart-search
POST /api/ai/generate-report
POST /api/ai/analyze-priority
POST /api/ai/generate-insights
GET  /api/ai/summarize-comments/:id
GET  /api/ai/daily-digest
GET  /api/ai/status

# Core
GET/POST/PUT/DELETE /api/tasks
GET/PUT              /api/users/:id
GET                  /api/users
GET                  /api/logs/user
GET                  /api/auth/attendance
```

## 🔒 Security
- JWT auth & RBAC, bcrypt hashing, CORS, secured env-based keys, input validation/sanitization.

## 🐛 Troubleshooting
- AI keys: verify in `backend/.env`; test with `curl http://localhost:5000/api/ai/status`.
- CORS/URLs: ensure `FRONTEND_URL` matches your deployed frontend.
- Mongo: confirm `MONGO_URI` correctness; check backend logs on start.

## 📚 Reference Docs
- AI features: `AI_FEATURES_GUIDE.md`
- Implementation summary: `IMPLEMENTATION_SUMMARY.md`
- Quick setup: `QUICK_START.md`
- Theme guide: `THEME_GUIDE.md`
- Checklist: `CHECKLIST.md`

---
Made with ❤️ — Sync_Solution: Link up now
