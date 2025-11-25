.

📌 TaskPulse – Full Stack Task Management System

A lightweight, role-based task manager built with React + Vite + Tailwind + Express + MongoDB.






🚀 Overview

TaskPulse ek minimal, fast, production-ready task management system hai.
Admin tasks create/assign karta hai, users apna dashboard dekhte hain, progress track hoti hai —
pure project ka flow lean, clean aur industry-style.

Aimed for:
✔ Portfolio
✔ Internship submission
✔ Hackathons
✔ Real-world use cases

🖼️ Screenshots

Replace these with real images after upload.

Login	Dashboard	Task List

	
	
⭐ Features
🔐 Authentication

Login/Signup with JWT

Role-based access (admin / user)

📝 Task Management

Create / Update / Delete tasks

Assign tasks to users

Priority: low, medium, high

Status lifecycle: pending, in-progress, completed

📋 Checklist

Add checklist items

Mark completed

Auto progress calculation

📊 Dashboards

Task distribution charts

Priority bar charts

Per-user statistics

📤 Reports

Export tasks as CSV/Excel

🛠️ Tech Stack
Frontend

React

Vite

TailwindCSS

Axios

Recharts

Backend

Node.js

Express.js

MongoDB + Mongoose

JWT Authentication

Multer (optional attachments)

📁 Project Structure
TaskPulse/
 ├── backend/
 │    ├── controllers/
 │    ├── routes/
 │    ├── models/
 │    ├── middleware/
 │    └── server.js
 ├── frontend/
 │    ├── src/
 │    │    ├── pages/
 │    │    ├── components/
 │    │    ├── context/
 │    │    └── utils/
 │    ├── index.html
 │    └── vite.config.js
 └── README.md

⚙️ Environment Variables
Backend .env
PORT=5000
MONGO_URI=mongodb://localhost:27017/taskpulse
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://localhost:3000

Frontend .env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_USE_CREDENTIALS=true

▶️ How to Run the Project
Backend
cd backend
npm install
npm run dev

Frontend
cd frontend
npm install
npm run dev

Access:

Frontend: http://localhost:3000

Backend API: http://localhost:5000/api

📡 API Summary
Method	Route	Description
GET	/tasks	List all tasks
GET	/tasks/:id	Get task by ID
POST	/tasks/create-task	Create new task
PUT	/tasks/:id	Update task
PUT	/tasks/:id/todo	Update checklist
GET	/tasks/user-dashboard-data	Dashboard stats
GET	/report/export/task	Export tasks
🧠 Common Gotchas

Field name must be todoCheckList (capital C).

Priority/status always lowercase.

If charts empty → check /user-dashboard-data response in Network.

If update fails → payload keys mismatch.

🔮 Future Improvements

Dark mode

Search + Filters

Drag & drop tasks

Socket.io live updates

File previews

🪪 License

MIT License — free to use.

🤝 Contributions

Open an issue → share logs → fix.