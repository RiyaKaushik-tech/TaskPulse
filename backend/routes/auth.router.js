import express from 'express';
import { SignIn, signout, signUp, updateUserProfile, uploadImage, userProfile } from '../controllers/auth.controller.js';
import { verifyUser } from '../utils/verifyUser.js';
import uploads from '../utils/uploadImage.js';

const router = express.Router();

router.post("/signUp", signUp);

router.post("/signIn", SignIn);
router.post("/sign-out", signout)

router.post("/userProfile", verifyUser , userProfile);
router.get("/userProfile", verifyUser , userProfile);

router.put("/updateUserProfile", verifyUser , updateUserProfile);

router.post("/uploadImage", uploads.single("image"), uploadImage);

export default router;