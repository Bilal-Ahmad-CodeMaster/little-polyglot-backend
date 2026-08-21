import { Router } from "express";
import {
  sendSignUpNotification,
  sendContactUsMessage,
} from "../controller/contact.controller.js";

const router = Router();

router.post("/sign-up", sendSignUpNotification);
router.post("/blog", sendContactUsMessage);

export default router;
