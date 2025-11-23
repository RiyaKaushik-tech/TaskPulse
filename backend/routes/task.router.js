import express from "express";
import { adminOnly, verifyUser } from "../utils/verifyUser.js";
import { createTask,deleteTask, getDashboardData, getTask, getTaskById, getUserDashboardData, updateTask, updateTaskStatus, updatetodoCheckList } from "../controllers/task.controller.js";

const router = express.Router();

router.post("/create-task", verifyUser,adminOnly, createTask);
router.get("/", verifyUser, getTask);
router.get("/dashboard-data", verifyUser,adminOnly, getDashboardData);
router.get("/user-dashboard-data", verifyUser, getUserDashboardData);
router.get("/:id", verifyUser, getTaskById);
router.put('/:id', verifyUser , updateTask)
router.delete('/:id', verifyUser ,adminOnly, deleteTask)
router.put('/:id/status', verifyUser , updateTaskStatus)
router.put('/:id/todo', verifyUser , updatetodoCheckList)


export default router;
