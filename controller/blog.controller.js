// controllers/blog.controller.js
import Blog from "../models/blogs.model.js";
import { uploadFileToS3, deleteFileFromS3 } from "../services/aws.service.js";
import path from "path";
import { getCache, setCache, invalidateCache } from "../services/cache.service.js";

const CACHE_PREFIX = "blogs";
const LIST_CACHE_KEY = `${CACHE_PREFIX}:all`;
const LIST_CACHE_TTL_MS = 60 * 1000;

// CREATE Blog
export const createBlog = async (req, res) => {
  try {
    const { title, subTitle, category, description, subDescription } = req.body;

    if (!title || !category || !description) {
      return res
        .status(400)
        .json({ message: "Title, category, and description are required." });
    }

    let imagesGallery = [];

    if (
      req.files &&
      req.files.imagesGallery &&
      req.files.imagesGallery.length > 0
    ) {
      imagesGallery = await Promise.all(
        req.files.imagesGallery.map(async (file) => {
          const key = `blog-images/${Date.now()}-${file.originalname}`;
          const imageUrl = await uploadFileToS3(
            path.resolve(file.path),
            key,
            file.mimetype
          );
          return { title: file.originalname, imageUrl };
        })
      );
    }

    const newBlog = await Blog.create({
      title,
      subTitle,
      category,
      description,
      subDescription,
      imagesGallery,
      likes: [],
    });

    invalidateCache(CACHE_PREFIX);

    res
      .status(201)
      .json({ message: "Blog created successfully", data: newBlog });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const existingBlog = await Blog.findById(id);
    if (!existingBlog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const {
      title,
      subTitle,
      category,
      description,
      subDescription,
      existingImageUrls = "[]",
    } = req.body;

    const parsedExistingImages = JSON.parse(existingImageUrls);
    let updatedImagesGallery = [];

    // 🔥 Delete removed images from S3 (in parallel)
    const removedImages = (existingBlog.imagesGallery || []).filter(
      (img) => !parsedExistingImages.includes(img.imageUrl)
    );
    await Promise.all(
      removedImages.map((img) => {
        const s3Key = img.imageUrl
          .split(".amazonaws.com/")[1]
          .replace("%2F", "/");
        return deleteFileFromS3(s3Key);
      })
    );

    // ✅ Retain existing images
    updatedImagesGallery = parsedExistingImages.map((url) => ({
      title: path.basename(url),
      imageUrl: url,
    }));

    // ➕ Add new uploads (in parallel)
    if (
      req.files &&
      req.files.imagesGallery &&
      req.files.imagesGallery.length > 0
    ) {
      const uploaded = await Promise.all(
        req.files.imagesGallery.map(async (file) => {
          const key = `blog-images/${Date.now()}-${file.originalname}`;
          const imageUrl = await uploadFileToS3(
            path.resolve(file.path),
            key,
            file.mimetype
          );
          return { title: file.originalname, imageUrl };
        })
      );
      updatedImagesGallery.push(...uploaded);
    }

    // 📝 Update blog fields
    existingBlog.title = title || existingBlog.title;
    existingBlog.subTitle = subTitle || existingBlog.subTitle;
    existingBlog.category = category || existingBlog.category;
    existingBlog.description = description || existingBlog.description;
    existingBlog.subDescription = subDescription || existingBlog.subDescription;
    existingBlog.imagesGallery = updatedImagesGallery;

    const updatedBlog = await existingBlog.save();
    invalidateCache(CACHE_PREFIX);

    res.status(200).json({ message: "Blog updated", data: updatedBlog });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// DELETE Blog

export const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // 🔥 Delete all images from S3 (in parallel)
    if (Array.isArray(blog.imagesGallery)) {
      await Promise.all(
        blog.imagesGallery
          .filter((img) => img.imageUrl)
          .map((img) => {
            const s3Key = img.imageUrl
              .split(".amazonaws.com/")[1]
              .replace("%2F", "/");
            return deleteFileFromS3(s3Key);
          })
      );
    }

    // ❌ Delete the blog from DB
    await blog.deleteOne();
    invalidateCache(CACHE_PREFIX);

    return res.status(200).json({
      message: "Blog and associated images deleted successfully",
    });
  } catch (error) {
    console.error("Delete Error:", error);
    return res.status(500).json({
      message: "Server error during blog deletion",
      error: error.message,
    });
  }
};
// GET all blogs
export const getAllBlogs = async (req, res) => {
  try {
    const cached = getCache(LIST_CACHE_KEY);
    if (cached) {
      return res.status(200).json({ message: "Blogs fetched", data: cached });
    }

    // .lean() skips Mongoose document hydration — faster to query and serialize.
    const blogs = await Blog.find().sort({ createdAt: -1 }).lean();
    setCache(LIST_CACHE_KEY, blogs, LIST_CACHE_TTL_MS);

    res.status(200).json({ message: "Blogs fetched", data: blogs });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET single blog by ID
export const getBlogById = async (req, res) => {
  try {
    const cacheKey = `${CACHE_PREFIX}:${req.params.id}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return res.status(200).json({ message: "Blog found", data: cached });
    }

    const blog = await Blog.findById(req.params.id).lean();
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    setCache(cacheKey, blog, LIST_CACHE_TTL_MS);

    res.status(200).json({ message: "Blog found", data: blog });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const likeDislikeBlog = async (req, res) => {
  console.log("hh");
  try {
    const { id } = req.params;
    const { action } = req.body; // expects 'like' or 'dislike'
    const userId = req.user && req.user.id; // assumes user info is in req.user

    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Ensure blog.likes is an array of userIds
    if (!Array.isArray(blog.likes)) {
      blog.likes = [];
    }

    if (action === "like") {
      if (blog.likes.includes(userId)) {
        return res
          .status(400)
          .json({ message: "You have already liked this blog." });
      }
      blog.likes.push(userId);
    } else if (action === "dislike") {
      if (!blog.likes.includes(userId)) {
        return res
          .status(400)
          .json({ message: "You have not liked this blog yet." });
      }
      blog.likes = blog.likes.filter(
        (uid) => uid.toString() !== userId.toString()
      );
    } else {
      return res
        .status(400)
        .json({ message: "Invalid action. Use 'like' or 'dislike'." });
    }

    await blog.save();
    invalidateCache(CACHE_PREFIX);

    res.status(200).json({ message: `Blog ${action}d`, data: blog });
  } catch (error) {
    res.status(500).json({ message: "Server error ", error: error.message });
  }
};
