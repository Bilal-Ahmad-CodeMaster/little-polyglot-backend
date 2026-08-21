import { Router } from "express";
import { translateTexts } from "../controller/translate.controller.js";

const router = Router();
router.post("/", translateTexts);

export default router;
