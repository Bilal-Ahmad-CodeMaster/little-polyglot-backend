import { Router } from "express";

import {
  createSchoolBranch,
  getAllSchoolBranches,
  getSchoolBranchById,
  updateSchoolBranch,
  deleteSchoolBranch,
} from "../controller/schoolBranche.controller.js";
const router = Router();

import { uploadMultiple } from "../services/multer.service.js";
import { JWTVerify } from "../middleware/auth.middleware.js";


router.post("/", JWTVerify, uploadMultiple, createSchoolBranch);
router.get("/", getAllSchoolBranches);
router.get("/:id", getSchoolBranchById);
router.patch("/:id", JWTVerify, uploadMultiple, updateSchoolBranch);
router.delete("/:id", JWTVerify, deleteSchoolBranch);
export default router;
