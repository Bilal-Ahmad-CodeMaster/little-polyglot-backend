// models/blog.model.js
import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
    },
    subTitle: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ["Wychowanie", "Kreatywna nauka", "Ciekawe miejsca"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    subDescription: {
      type: String,
      trim: true,
    },
    imagesGallery: [
      {
        title: String,
        imageUrl: String,
      },
    ],
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Blog = mongoose.model("Blog", blogSchema);
export default Blog;
