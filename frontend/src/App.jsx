import { BrowserRouter, Route, Routes } from "react-router-dom"
import Login from "./pages/auth/Login.jsx"
import React, { useEffect } from "react"
import SignUp from "./pages/auth/SignUp.jsx"
import PrivateRoute from "./routes/privateRoute.jsx"
import CreateTask from "./pages/admin/createTasks.jsx"
import ManageTasks from "./pages/admin/manageTasks.jsx"
import ManageUsers from "./pages/admin/manageUsers.jsx"
import MyTasks from "./pages/users/myTasks.jsx"
import TaskDetails from "./pages/users/taskDetails.jsx"
import UserDashboard from "./pages/users/userDashboard.jsx"
import UserDetails from "./pages/users/UserDetails.jsx"
import Dashboard from "./pages/admin/dashboard.jsx"
import HomePage from "./pages/home.jsx"
import NotFound from "./pages/NotFound.jsx"
import ErrorBoundary from "./components/ErrorBoundary.jsx"
import TaskCard from "./components/TaskCard.jsx"
import Notifications from "./pages/users/Notifications";
import ActivityLogs from "./pages/admin/ActivityLogs";
import { useSelector } from "react-redux"
import { initSocket } from "./utils/socket.js"
import { Toaster } from "react-hot-toast"
import "./theme.css"

function App() {
   const user = useSelector((state) => state.user);   const { activeTheme } = useSelector((state) => state.theme);
  useEffect(() => {
    const htmlElement = document.documentElement;
    if (activeTheme === "dark") {
      htmlElement.setAttribute("data-theme", "dark");
    } else {
      htmlElement.removeAttribute("data-theme");
    }
  }, [activeTheme]);

  useEffect(() => {
    if (user?.token) {
      initSocket({ token: user.token });
    }
  }, [user?.token]);
  return (
     <div
          style={{
            backgroundColor: "var(--bg-primary)",
            color: "var(--text-primary)",
            minHeight: "100vh"
          }}
        >
    <BrowserRouter>
    <ErrorBoundary>
      <Routes>
        <Route path="*" element={<NotFound />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signUp" element={<SignUp />} />

      {/* admin routes */}
      <Route element={<PrivateRoute allowedRoles={["admin"]}/>}>
        <Route path="/admin/dashboard" element={<Dashboard/>} />
        <Route path="/admin/create-task" element={<CreateTask/>} />
        <Route path="/admin/manageUsers" element={<ManageUsers/>} />
        <Route path="/admin/users/:id" element={<UserDetails/>} />
        <Route path="/admin/manageTasks" element={<ManageTasks/>} />
  <Route path="/admin/activity-logs" element={<ActivityLogs />} />
      </Route>

      {/* users routes */}
      <Route element={<PrivateRoute allowedRoles={["user"]}/>}>
        <Route path="/users/myTasks" element={<MyTasks/>} />
        <Route path="/users/taskDetails" element={<TaskCard />} />
        <Route path="/users/userDashboard" element={<UserDashboard/>} />
        <Route path="/tasks/:id" element={<TaskDetails />} />
        <Route path="/users/notifications" element={<Notifications />} />
      </Route>
      </Routes>
      <Toaster/>
    </ErrorBoundary>
    </BrowserRouter>
   </div>
  )
}

export default App
