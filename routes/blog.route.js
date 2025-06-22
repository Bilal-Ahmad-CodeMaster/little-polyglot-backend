// routes/blog.routes.js
import express from "express";
import {
  createBlog,
  getAllBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
} from "../controller/blog.controller.js";
import upload from "../services/multer.service.js";

const router = express.Router();

router.post("/", upload.single("image"), createBlog);
router.put("/:id", upload.single("image"), updateBlog);

router.get("/", getAllBlogs);
router.get("/:id", getBlogById);

router.delete("/:id", deleteBlog);

export default router;
