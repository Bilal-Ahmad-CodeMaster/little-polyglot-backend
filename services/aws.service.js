import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import fs from "fs";
import dotenv from "dotenv";
import path from "path";
dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

export const uploadFileToS3 = async (filePath, key, mimetype) => {
  try {
    const resolvedPath = path.resolve(filePath);
    const fileBuffer = fs.readFileSync(resolvedPath);

    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimetype,
    };

    const command = new PutObjectCommand(uploadParams);
    await s3.send(command);
    console.log(`✅ Uploaded to S3: ${key}`);

    // Only delete AFTER upload succeeds
    if (fs.existsSync(resolvedPath)) {
      fs.unlinkSync(resolvedPath);
      console.log(`🗑️ Deleted local file: ${resolvedPath}`);
    }

    return `https://${process.env.AWS_BUCKET_NAME}.s3.${
      process.env.AWS_REGION
    }.amazonaws.com/${encodeURIComponent(key)}`;
  } catch (error) {
    console.error("❌ Error uploading to S3:", error);
    throw error;
  }
};
export const deleteFileFromS3 = async (key) => {
  try {
    const deleteParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    };

    const command = new DeleteObjectCommand(deleteParams);
    await s3.send(command);

    console.log(`File deleted successfully: ${key}`);
    return { success: true, message: `File deleted: ${key}` };
  } catch (error) {
    console.error("Error deleting file from S3:", error);
    throw error;
  }
};
