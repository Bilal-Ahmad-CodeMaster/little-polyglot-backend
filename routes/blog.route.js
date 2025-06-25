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
import upload from "../services/multer.service.js";
import { JWTVerify } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/",JWTVerify, upload.single("image"), createBlog);
router.post("/likeDislike/:id",JWTVerify, likeDislikeBlog);
router.put("/:id", JWTVerify, JWTVerify, upload.single("image"), updateBlog);

router.get("/", getAllBlogs);
router.get("/:id", getBlogById);

router.delete("/:id", JWTVerify, deleteBlog);

export default router;
