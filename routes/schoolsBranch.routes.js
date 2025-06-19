import { Router } from "express";

import {
  createSchoolBranch,
  getAllSchoolBranches,
  getSchoolBranchById,
  updateSchoolBranch,
  deleteSchoolBranch,
  deleteMediaFromBranch,
} from "../controller/schoolBranche.controller.js";
const router = Router();
import upload from "../services/multer.service.js";
import { uploadMultiple } from "../services/multer.service.js";

router.post("/", uploadMultiple, createSchoolBranch);
router.get("/", getAllSchoolBranches);
router.get("/:id", getSchoolBranchById);
router.patch("/:id", uploadMultiple, updateSchoolBranch);
router.delete("/:id", deleteSchoolBranch);
router.delete(
  "/:id/:mediaType/:mediaId",
  deleteMediaFromBranch
);
export default router;
