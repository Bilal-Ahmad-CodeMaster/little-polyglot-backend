import Router from "express";
import * as authController from "../controller/auth.controller.js";
import upload from "../services/multer.service.js";
import { JWTVerify } from "../middleware/auth.middleware.js";
const router = Router();

router.post("/signup", upload.single("file"), authController.signUpController);
router.post("/signin", authController.signinController);
router.post("/sendOtp", authController.sendOtp);

router.post(
  "/verifyOtpAndResetPassword",
  authController.verifyOtpAndResetPassword
);
router.get("/signout", JWTVerify, authController.signOutController);

export default router;
