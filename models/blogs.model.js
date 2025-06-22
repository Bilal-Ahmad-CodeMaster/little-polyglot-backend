// models/blog.model.js
import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    Title: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["Wychowanie", "Kreatywna nauka", "Ciekawe miejsca"],
    },
    description: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
    likes: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Blog = mongoose.model("Blog", blogSchema);
export default Blog;
