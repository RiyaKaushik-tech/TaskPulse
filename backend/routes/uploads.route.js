import express from "express";
import { uploadFiles } from "../controllers/upload.controller.js";
// import protect from "../middleware/auth.js"; // optional: require auth

const router = express.Router();

router.post("/", /*protect,*/ uploadFiles);

export default router;