// routes/blog.routes.js
import express from "express";
import {
  createBlog,
  getAllBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  likeDislikeBlog,
} from "../controller/blog.controller.js";

import { JWTVerify } from "../middleware/auth.middleware.js";
import { uploadMultiple } from "../services/multer.service.js";

const router = express.Router();

router.post("/",JWTVerify,uploadMultiple, createBlog);
router.post("/likeDislike/:id",JWTVerify, likeDislikeBlog);
router.put("/:id", JWTVerify, JWTVerify,uploadMultiple, updateBlog);

router.get("/", getAllBlogs);
router.get("/:id", getBlogById);

router.delete("/:id", JWTVerify, deleteBlog);

export default router;
