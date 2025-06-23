import fs from "fs";
import multer from "multer";
import path from "path";

// Ensure the upload directory exists
const uploadDir = "./temp/uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// File filter for images and resumes
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "video/mp4",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPG, PNG, PDF, and DOCX allowed."));
  }
};

// Multer instance
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 *1024 }, // 100MB
  fileFilter,
});
export default upload;
export const uploadMultiple = upload.fields([
  { name: "imagesGallery", maxCount: 10 },
  { name: "videosGallery", maxCount: 5 },
]);
