// controllers/blog.controller.js
import Blog from "../models/blogs.model.js";
import { uploadFileToS3, deleteFileFromS3 } from "../services/aws.service.js"; // adjust path
import path from "path";

// CREATE BLOG with image upload
export const createBlog = async (req, res) => {
  try {
    const { Title, category, description } = req.body;

    if (!Title || !category || !description) {
      return res.status(400).json({ message: "All fields are required." });
    }

    let imageUrl = null;
    if (req.file) {
      const key = `blog-images/${Date.now()}-${req.file.originalname}`;
      imageUrl = await uploadFileToS3(
        path.resolve(req.file.path),
        key,
        req.file.mimetype
      );
    }

    const newBlog = await Blog.create({
      Title,
      category,
      description,
      image: imageUrl,
    });

    res.status(201).json({ message: "Blog created", data: newBlog });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET all blogs
export const getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.status(200).json({ message: "Blogs fetched", data: blogs });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET single blog by ID
export const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    res.status(200).json({ message: "Blog found", data: blog });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const { Title, category, description } = req.body;

    let updatedImage = blog.image;

    if (req.file) {
      // 🧹 Delete old image from S3 if it exists
      if (blog.image) {
        const urlParts = blog.image.split("/");
        const url = urlParts.slice(3).join("/"); // Removes "https://s3.region.amazonaws.com/bucket-name/"
        const key = url.replace("%2F", "/");// Extract S3 key
        console.log(key);

        await deleteFileFromS3(key);
      }

      // 🚀 Upload new image to S3
      const newKey = `blog-images/${Date.now()}-${req.file.originalname}`;
      updatedImage = await uploadFileToS3(
        path.resolve(req.file.path),
        newKey,
        req.file.mimetype
      );
    }

    // 📝 Update blog fields
    blog.Title = Title || blog.Title;
    blog.category = category || blog.category;
    blog.description = description || blog.description;
    blog.image = updatedImage;

    const updatedBlog = await blog.save();

    res.status(200).json({ message: "Blog updated", data: updatedBlog });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// DELETE a blog
export const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Delete associated image from S3 if exists
    if (blog.image) {
      const urlParts = blog.image.split("/");
      const url = urlParts.slice(3).join("/"); // Removes "https://s3.region.amazonaws.com/bucket-name/"
      const key= url.replace("%2F","/")
      console.log(key);

      await deleteFileFromS3(key);
    }

    await blog.deleteOne();

    res.status(200).json({ message: "Blog and image deleted successfully" });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
