# TaskPulse — AI‑assisted task management for modern teams

A production-grade, full‑stack task management system with real‑time notifications, role‑based access, attendance tracking, file uploads, and a suite of AI capabilities (task suggestions, subtasks, semantic search, reports, insights, comment summarization, and daily digests) powered by Groq, Google Gemini, Hugging Face, and Cohere.

> Repo: https://github.com/RiyaKaushik-tech/TaskPulse  
> Live Demo (Frontend): https://task-pulse-jo23.onrender.com  
> API Base (Backend default): https://taskpulse-backend-jaye.onrender.com

---

## Key Features

### Core Product
- **JWT authentication** (token returned on login; also supports HTTP-only cookie `access_token`)
- **RBAC**: Admin vs User permissions enforced on server routes (`adminOnly`)
- **Task lifecycle management**: create/update/delete, status updates, todo checklist updates
- **Multi-assignee tasks** with due dates, priority, tags, and attachments
- **Comments with threading support** (top-level + replies), mentions, and metadata
- **Real-time notifications** via **Socket.IO** (per-user rooms `user:<id>`)
- **Attendance tracking** derived from login activity + a daily checker to mark present/absent
- **Activity logs / notification feed** with pagination and read/unread state
- **Export reports** (Excel) for tasks and users (admin only)
- **File uploads** (multer) served from `/uploads`

### AI Capabilities (Protected Endpoints)
- **Task suggestions** (Groq) – generate title/description/tags/priority/time estimate
- **Subtask generation** (Groq) – actionable checklist generation
- **Priority analysis** (Gemini)
- **Report generation** (Gemini)
- **Performance insights** (Gemini)
- **Semantic task search** (Hugging Face embeddings)
- **Comment summarization** (Cohere)
- **Daily digest** (Cohere)
- **AI status endpoint** to verify service configuration at runtime

---

## Technical Architecture Overview

TaskPulse is a split frontend/backend system:

- **Frontend (Vite + React)** calls the backend through an `axios` instance.
  - Authentication token is persisted in `localStorage` and attached as `Authorization: Bearer <token>` by an interceptor.
  - Socket.IO client is initialized after login and authenticates via Socket handshake token (`auth.token`).
  - UI includes admin and user workspaces, charts, AI-assisted widgets, theming, and error boundaries.

- **Backend (Express + MongoDB)** exposes a REST API under `/api`.
  - `verifyUser` middleware validates JWT from either the `Authorization` header or cookies.
  - Socket.IO uses a JWT-authenticated handshake and assigns each connection to a per-user room.
  - Domain objects are modeled with Mongoose schemas (Tasks, Users, Comments, Events), including performance indexes.
  - In-memory caching middleware reduces repeated reads for dashboard and task endpoints, with explicit invalidation on writes.
  - Background utilities exist to check **overdue tasks** and **user attendance** and emit notifications through Socket.IO.

---

## Tech Stack

### Frontend
| Category | Libraries |
|---|---|
| UI | React, React Router |
| Charts | Chart.js, react-chartjs-2, Recharts |
| Motion | Framer Motion |
| Dates | moment, react-datepicker |
| Networking | Axios |
| Realtime | socket.io-client |
| Notifications | react-hot-toast |
| Icons | react-icons |
| Linting/Tooling | Vite, ESLint |

### Backend
| Category | Libraries |
|---|---|
| Runtime | Node.js (ESM) |
| Web | Express, CORS, cookie-parser, compression |
| Database | MongoDB, Mongoose |
| Auth | jsonwebtoken, bcryptjs |
| Realtime | socket.io |
| Uploads | multer |
| Exports | exceljs |
| AI SDKs | groq-sdk, @google/generative-ai, @huggingface/inference, cohere-ai |
| Misc | node-fetch, dotenv |

### State Management
- **Redux Toolkit**
- **redux-persist** (persists user + theme preferences)

### APIs / Integrations
- **Groq** (LLM inference)
- **Google Gemini** (analysis + report generation)
- **Hugging Face Inference** (embeddings + semantic search)
- **Cohere** (summarization + digest)

### Authentication
- **JWT** (Authorization header and/or cookie `access_token`)
- RBAC middleware: `verifyUser`, `adminOnly`

### Styling
- **Tailwind CSS**
- **Theme system** with CSS variables (`theme.css`) + persisted mode (light/dark/system)

### Tooling & Build
- Vite build optimizations: **manual chunk splitting** + dependency pre-optimization

---

## Folder Structure

```text
TaskPulse/
├─ backend/
│  ├─ controllers/
│  │  ├─ ai.controller.js
│  │  ├─ auth.controller.js
│  │  ├─ comment.controller.js
│  │  ├─ report.controller.js
│  │  ├─ task.controller.js
│  │  ├─ upload.controller.js
│  │  └─ users.controller.js
│  ├─ models/
│  │  ├─ Comment.modal.js
│  │  ├─ Event.js
│  │  ├─ task.modal.js
│  │  └─ user.modals.js
│  ├─ routes/
│  │  ├─ ai.router.js
│  │  ├─ auth.router.js
│  │  ├─ logs.router.js
│  │  ├─ reportRouter.js
│  │  ├─ task.router.js
│  │  ├─ uploads.route.js
│  │  └─ user.Router.js
│  ├─ uploads/
│  ├─ utils/
│  │  ├─ aiServices.js
│  │  ├─ cache.js
│  │  ├─ checkOverdueTasks.js
│  │  ├─ checkUserAttendance.js
│  │  ├─ error.js
│  │  ├─ LoggerHelper.js
│  │  ├─ uploadImage.js
│  │  └─ verifyUser.js
│  ├─ index.js
│  └─ package.json
├─ frontend/
│  ├─ src/
│  │  ├─ components/        # includes AI components, layouts, charts, etc.
│  │  ├─ pages/             # admin, user, auth routes
│  │  ├─ redux/             # store + slices (user, theme)
│  │  ├─ routes/
│  │  └─ utils/             # axiosInstance, socket, helpers
│  ├─ index.html
│  ├─ vite.config.ts
│  └─ package.json
├─ AI_FEATURES_GUIDE.md
├─ IMPLEMENTATION_SUMMARY.md
├─ QUICK_START.md
├─ THEME_GUIDE.md
├─ VISUAL_OVERVIEW.md
└─ readme.md

---

## Installation & Setup

### Prerequisites
- Node.js **18+**
- MongoDB (local or Atlas)

### Clone
```bash
git clone https://github.com/RiyaKaushik-tech/TaskPulse.git
cd TaskPulse
```

### Backend
```bash
cd backend
npm install
npm run dev
# or
npm start
```

### Frontend
```bash
cd ../frontend
npm install
npm run dev
```

---

## Environment Variables

### Backend (`backend/.env`)

Create `backend/.env` (or start from `.env.example` if present):

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/taskpulse

# Auth
JWT_SECRET=your-strong-secret
ADMIN_JOIN_CODE=your-admin-join-code

# CORS / Frontend
FRONTEND_URL=https://task-pulse-jo23.onrender.com
CORS_ORIGIN=https://task-pulse-jo23.onrender.com

# AI Providers
GROQ_API_KEY=your_groq_key
GEMINI_API_KEY=your_gemini_key
HUGGINGFACE_API_KEY=your_hf_key
COHERE_API_KEY=your_cohere_key
```

### Frontend (`frontend/.env`)

```env
VITE_API_BASE=http://localhost:5000
# production example:
# VITE_API_BASE=https://taskpulse-backend-jaye.onrender.com
```

---

## Usage Guide

### Authentication & Roles
- **Sign up** through the UI.
- Provide `adminJoinCode` (must match `ADMIN_JOIN_CODE`) to register as an **Admin**.
- Log in to receive a JWT used for API calls and Socket.IO authentication.

### Admin
- Create and assign tasks
- Use AI endpoints to generate tasks/subtasks, reports, and insights
- Export users and tasks to Excel
- View global activity logs and attendance overview

### User
- Manage assigned tasks and checklist items
- Comment and reply in task threads
- Receive real-time notifications
- Use summarization/digest features (when AI keys are configured)

---

## API Endpoints

Base path: `/api`

### Auth
- `POST /auth/signUp`
- `POST /auth/signIn`
- `POST /auth/sign-out`
- `GET  /auth/userProfile`
- `PUT  /auth/updateUserProfile`
- `POST /auth/uploadImage`
- `GET  /auth/attendance`
- `GET  /auth/attendance/all` (admin)

### Tasks
- `POST   /tasks/create-task` (admin)
- `GET    /tasks`
- `GET    /tasks/:id`
- `PUT    /tasks/:id`
- `DELETE /tasks/:id` (admin)
- `PUT    /tasks/:id/status`
- `PUT    /tasks/:id/todo`
- `POST   /tasks/:id/comment`
- `GET    /tasks/dashboard-data` (admin)
- `GET    /tasks/user-dashboard-data`

### Logs / Notifications
- `GET  /logs/user`
- `GET  /logs/user/unread-count`
- `PUT  /logs/user/read-all`
- `PUT  /logs/:id/read`
- `GET  /logs/admin` (admin)

### Reports (Excel)
- `GET /reports/export/task` (admin)
- `GET /reports/export/user` (admin)

### Uploads
- `POST /uploads` (multi-file upload; returns URLs served from `/uploads/*`)

### AI (Protected)
- `POST /ai/suggest-task`
- `POST /ai/generate-subtasks`
- `POST /ai/smart-search`
- `POST /ai/generate-report`
- `POST /ai/analyze-priority`
- `POST /ai/generate-insights`
- `GET  /ai/summarize-comments/:taskId`
- `GET  /ai/daily-digest`
- `GET  /ai/status`

---

## Engineering Highlights

- **Socket.IO authorization + per-user channels**: clients join `user:<id>` rooms after JWT validation to receive targeted events.
- **Centralized notification/event logging**: notification creation is consolidated in helper utilities and exposed via `/api/logs`.
- **Read-path caching + targeted invalidation**: cache middleware reduces redundant DB reads on dashboard/task endpoints, invalidated on task mutation.
- **Schema-level indexing**: models define indexes aligned to read patterns (e.g., status/assignee/time).
- **Theme UX**: theme bootstraps early to prevent a flash of incorrect theme and persists user preference.

---

## Performance / Optimization Notes

- **Backend**: gzip compression, request-size limits, caching for high-traffic read endpoints.
- **Frontend**: Vite chunk splitting improves caching and reduces initial payload; dependency pre-optimization speeds dev startup.

---

## Security Considerations

- JWT verification across protected routes; server remains source of truth for authorization.
- Passwords are hashed using bcrypt.
- CORS is configured with explicit origin and `credentials` support.
- Upload endpoints enforce file limits and apply image-only validation for profile images.

> Note: Backend authorization is enforced; ensure frontend route gating also mirrors role checks for UX consistency.

---

## Future Improvements

- Strengthen frontend route protection (role-based route guards + redirects).
- Replace in-memory cache with Redis for horizontal scaling.
- Add request validation (schema-based) and rate limiting, especially on AI endpoints.
- Add observability: structured logs, metrics, tracing, and health checks.
- Provide an OpenAPI/Swagger spec for the REST API.

---

## Author

**Riya Kaushik**
