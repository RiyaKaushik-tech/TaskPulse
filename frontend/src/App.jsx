import { BrowserRouter, Route, Routes } from "react-router-dom"
import Login from "./pages/auth/Login.jsx"
import React from "react"
import SignUp from "./pages/auth/SignUp.jsx"
import PrivateRoute from "./routes/privateRoute.js"
import CreateTasks from "./pages/admin/createTasks.js"
import ManageTasks from "./pages/admin/manageTasks.js"
import ManageUsers from "./pages/admin/manageUsers.js"
import MyTasks from "./pages/users/myTasks.js"
import TaskDeatils from "./pages/users/taskDeatils.js"
import UserDashboard from "./pages/users/userDashboard.jsx"
import Dashboard from "./pages/admin/dashboard.jsx"
import HomePage from "./pages/home.js"
import NotFound from "./pages/NotFound.js"
import ErrorBoundary from "./components/ErrorBoundary.js"

function App() {
  return (
   <div>
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
        <Route path="/admin/createTask" element={<CreateTasks/>} />
        <Route path="/admin/manageUsers" element={<ManageUsers/>} />
        <Route path="/admin/manageTasks" element={<ManageTasks/>} />
      </Route>

      {/* users routes */}
      <Route element={<PrivateRoute allowedRoles={["user"]}/>}>
        <Route path="/users/myTasks" element={<MyTasks/>} />
        <Route path="/users/taskDeatils" element={<TaskDeatils/>} />
        <Route path="/users/userDashboard" element={<UserDashboard/>} />
      </Route>
      </Routes>
    </ErrorBoundary>
    </BrowserRouter>
   </div>
  )
}

export default App
