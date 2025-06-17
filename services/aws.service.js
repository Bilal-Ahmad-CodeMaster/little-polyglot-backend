import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import fs from "fs";
import dotenv from "dotenv";

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
    const fileBuffer = fs.readFileSync(filePath);

    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimetype,
    };

    const command = new PutObjectCommand(uploadParams);
    await s3.send(command);
    console.log(`File uploaded successfully at ${key}`);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted: ${filePath}`);
    } else {
      console.log(`File not found: ${filePath}`);
    }

    return `https://s3.${process.env.AWS_REGION}.amazonaws.com/${
      process.env.AWS_BUCKET_NAME
    }/${key.replaceAll(" ", "&")}`;
  } catch (error) {
    console.error("Error uploading to S3:", error);
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
