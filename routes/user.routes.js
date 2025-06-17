import Router from "express";
import * as userController from "../controller/user.controller.js";
import { checkRole, JWTVerify } from "../middleware/auth.middleware.js";
import upload from "../services/multer.service.js";

const router = Router();


router.post("/changePassword", JWTVerify, userController.changePassword);

router.get("/me/profile", JWTVerify, userController.myProfile);
router.patch(
  "/me/update-profile",
  JWTVerify,
  upload.single("file"),
  userController.updateMyProfile
);




export default router;
