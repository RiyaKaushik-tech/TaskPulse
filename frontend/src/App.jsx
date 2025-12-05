import { BrowserRouter, Route, Routes } from "react-router-dom"
import Login from "./pages/auth/Login.jsx"
import React from "react"
import SignUp from "./pages/auth/SignUp.jsx"
import PrivateRoute from "./routes/privateRoute.jsx"
import CreateTask from "./pages/admin/createTasks.jsx"
import ManageTasks from "./pages/admin/manageTasks.jsx"
import ManageUsers from "./pages/admin/manageUsers.jsx"
import MyTasks from "./pages/users/myTasks.jsx"
import TaskDetails from "./pages/users/TaskDetails.jsx"
import UserDashboard from "./pages/users/userDashboard.jsx"
import Dashboard from "./pages/admin/dashboard.jsx"
import HomePage from "./pages/home.jsx"
import NotFound from "./pages/NotFound.jsx"
import ErrorBoundary from "./components/ErrorBoundary.jsx"
import TaskCard from "./components/TaskCard.jsx"

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
        <Route path="/admin/create-task" element={<CreateTask/>} />
        <Route path="/admin/manageUsers" element={<ManageUsers/>} />
        <Route path="/admin/manageTasks" element={<ManageTasks/>} />
      </Route>

      {/* users routes */}
      <Route element={<PrivateRoute allowedRoles={["user"]}/>}>
        <Route path="/users/myTasks" element={<MyTasks/>} />
        <Route path="/users/taskDetails" element={<TaskCard />} />
        <Route path="/users/userDashboard" element={<UserDashboard/>} />
        <Route path="/tasks/:id" element={<TaskDetails />} />
      </Route>
      </Routes>
    </ErrorBoundary>
    </BrowserRouter>
   </div>
  )
}

export default App
