// controllers/schoolBranchController.js
import SchoolBranch from "../models/schoolsBranches.model.js";
import setResponse from "../services/helper.service.js";
import mongoose from "mongoose";
import { uploadFileToS3, deleteFileFromS3 } from "../services/aws.service.js";
import path from "path";
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// CREATE with AWS S3 Upload Support
export const createSchoolBranch = async (req, res) => {
  try {
    const parseIfString = (field) => {
      try {
        return typeof field === "string" ? JSON.parse(field) : field;
      } catch {
        return field;
      }
    };

    const {
      region,
      city,
      annotation,
      schoolName,
      googleLocation,
      priceList,
      contactInfo,
      schoolDetail,
      BranchEvents,
      franchiseDetails,
      SEOBaseAdditionalInfo,
      extraInfoModal,
      imageGalleryAboutUsDescription,
      streetAddress,
    } = req.body;

    // Parse fields that come as JSON strings in FormData
    const parsedPriceList = parseIfString(priceList);
    const parsedContactInfo = parseIfString(contactInfo);
    const parsedSchoolDetail = parseIfString(schoolDetail);
    const parsedFranchiseDetails = parseIfString(franchiseDetails);
    const parsedBranchEvents = parseIfString(BranchEvents);
    const parsedSEOBaseInfo = parseIfString(SEOBaseAdditionalInfo);
    const parsedExtraInfoModal = parseIfString(extraInfoModal);

    if (
      !region ||
      !city ||
      !schoolName ||
      !googleLocation ||
      !parsedContactInfo ||
      !parsedSchoolDetail ||
      !parsedFranchiseDetails ||
      !imageGalleryAboutUsDescription
    ) {
      return setResponse(res, {
        type: "bad",
        message: "Required fields are missing",
      });
    }

    let videosGallery = [];
    let imagesGallery = [];

    if (req.files) {
      if (req.files.videosGallery) {
        for (const file of req.files.videosGallery) {
          const key = `videos/${Date.now()}-${file.originalname}`;
          const videoUrl = await uploadFileToS3(file.path, key, file.mimetype);
          videosGallery.push({ title: file.originalname, videoUrl });
        }
      }

      if (req.files.imagesGallery) {
        for (const file of req.files.imagesGallery) {
          const key = `images/${Date.now()}-${file.originalname}`;
          const imageUrl = await uploadFileToS3(file.path, key, file.mimetype);
          imagesGallery.push({ title: file.originalname, imageUrl });
        }
      }
    }

    const newBranch = await SchoolBranch.create({
      streetAddress,
      region,
      city,
      annotation,
      schoolName,
      googleLocation,
      contactInfo: parsedContactInfo,
      priceList: parsedPriceList,
      schoolDetail: parsedSchoolDetail,
      BranchEvents: parsedBranchEvents,
      franchiseDetails: parsedFranchiseDetails,
      SEOBaseAdditionalInfo: parsedSEOBaseInfo,
      extraInfoModal: parsedExtraInfoModal,
      imageGalleryAboutUsDescription,
      videosGallery,
      imagesGallery,
    });

    return setResponse(res, {
      type: "success",
      message: "School branch created successfully",
      data: newBranch,
    });
  } catch (error) {
    return setResponse(res, {
      type: "error",
      message: error.message,
    });
  }
};

// READ ALL
export const getAllSchoolBranches = async (req, res) => {
  try {
    const branches = await SchoolBranch.find();
    return setResponse(res, {
      type: "success",
      message: "School branches retrieved successfully",
      data: branches,
    });
  } catch (error) {
    return setResponse(res, {
      type: "error",
      message: error.message,
    });
  }
};

// READ ONE
export const getSchoolBranchById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return setResponse(res, {
        type: "bad",
        message: "Invalid ID format",
      });
    }

    const branch = await SchoolBranch.findById(id);
    if (!branch) {
      return setResponse(res, {
        type: "notFound",
        message: "School branch not found",
      });
    }

    return setResponse(res, {
      type: "success",
      message: "School branch retrieved successfully",
      data: branch,
    });
  } catch (error) {
    return setResponse(res, {
      type: "error",
      message: error.message,
    });
  }
};

export const updateSchoolBranch = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return setResponse(res, { type: "bad", message: "Invalid ID format" });
    }

    const existingBranch = await SchoolBranch.findById(id);
    if (!existingBranch) {
      return setResponse(res, {
        type: "notFound",
        message: "School branch not found",
      });
    }

    // Helper to parse JSON strings from FormData
    const parseField = (field) => {
      try {
        return typeof field === "string" ? JSON.parse(field) : field;
      } catch {
        return field;
      }
    };

    // 🧾 Handle fields from FormData (data is JSON stringified object)
    const parsed = req.body.data ? parseField(req.body.data) : req.body;
    const incomingImageUrls = parseField(req.body.existingImageUrls || "[]");
    const incomingVideoUrls = parseField(req.body.existingVideoUrls || "[]");

    let updatedImages = [];
    let updatedVideos = [];

    // 🧹 DELETE Removed Images from S3
    const removedImages = (existingBranch.imagesGallery || []).filter(
      (img) => !incomingImageUrls.includes(img.imageUrl)
    );
    for (const img of removedImages) {
      // Extract S3 key from the image URL
      const s3Key = img.imageUrl.split(".amazonaws.com/")[1];
      if (s3Key) {
        const deleteKey = s3Key.replace("%2F", "/");

        await deleteFileFromS3(deleteKey);
      }
    }

    // 🧹 DELETE Removed Videos from S3
    const removedVideos = (existingBranch.videosGallery || []).filter(
      (vid) => !incomingVideoUrls.includes(vid.videoUrl)
    );
    for (const vid of removedVideos) {
      const s3Key = vid.videoUrl.split(".amazonaws.com/")[1];
      const deleteKey = s3Key.replace("%2F", "/");
      await deleteFileFromS3(deleteKey);
    }

    // ✅ Keep URLs user wants to retain
    updatedImages = incomingImageUrls.map((url) => ({
      title: path.basename(url),
      imageUrl: url,
    }));

    updatedVideos = incomingVideoUrls.map((url) => ({
      title: path.basename(url),
      videoUrl: url,
    }));

    // 🆕 Add new uploaded files to updated arrays
    if (req.files) {
      if (req.files.imagesGallery) {
        for (const file of req.files.imagesGallery) {
          const key = `images/${Date.now()}-${file.originalname}`;
          const imageUrl = await uploadFileToS3(
            path.resolve(file.path),
            key,
            file.mimetype
          );
          updatedImages.push({ title: file.originalname, imageUrl });
        }
      }

      if (req.files.videosGallery) {
        for (const file of req.files.videosGallery) {
          const key = `videos/${Date.now()}-${file.originalname}`;
          const videoUrl = await uploadFileToS3(
            path.resolve(file.path),
            key,
            file.mimetype
          );
          updatedVideos.push({ title: file.originalname, videoUrl });
        }
      }
    }

    // ✅ Update branch data in DB
    const updatedBranch = await SchoolBranch.findByIdAndUpdate(
      id,
      {
        region: parsed.region,
        streetAddress: parsed.streetAddress,
        city: parsed.city,
        annotation: parsed.annotation,
        schoolName: parsed.schoolName,
        googleLocation: parsed.googleLocation,
        imageGalleryAboutUsDescription: parsed.imageGalleryAboutUsDescription,
        contactInfo: parseField(parsed.contactInfo),
        priceList: parseField(parsed.priceList),
        schoolDetail: parseField(parsed.schoolDetail),
        BranchEvents: parseField(parsed.BranchEvents),
        franchiseDetails: parseField(parsed.franchiseDetails),
        SEOBaseAdditionalInfo: parseField(parsed.SEOBaseAdditionalInfo),
        extraInfoModal: parseField(parsed.extraInfoModal),
        imagesGallery: updatedImages,
        videosGallery: updatedVideos,
      },
      { new: true, runValidators: true }
    );

    return setResponse(res, {
      type: "success",
      message: "School branch updated successfully",
      data: updatedBranch,
    });
  } catch (error) {
    console.error("Update Error:", error);
    return setResponse(res, {
      type: "error",
      message: error.message,
    });
  }
};

// DELETE
export const deleteSchoolBranch = async (req, res) => {
  try {
    const { id } = req.params;

    const branch = await SchoolBranch.findById(id);
    if (!branch) {
      return res.status(404).json({ message: "School branch not found" });
    }

    // 🔥 Delete all images from S3
    if (Array.isArray(branch.imagesGallery)) {
      for (const img of branch.imagesGallery) {
        if (img.imageUrl) {
          const key = img.imageUrl.split(".amazonaws.com/")[1];
          const deleteKey = key.replace("%2F", "/");
          console.log("deleted key ", deleteKey);

          await deleteFileFromS3(deleteKey);
        }
      }
    }

    // 🔥 Delete all videos from S3
    if (Array.isArray(branch.videosGallery)) {
      for (const vid of branch.videosGallery) {
        if (vid.videoUrl) {
          const key = vid.videoUrl.split(".amazonaws.com/")[1];
          const deleteKey = key.replace("%2F", "/");
          console.log("deleted key ", deleteKey);
          await deleteFileFromS3(deleteKey);
        }
      }
    }

    // ❌ Delete the document from DB
    await branch.deleteOne();

    return res
      .status(200)
      .json({ message: "School branch and media deleted successfully" });
  } catch (error) {
    console.error("Branch Deletion Error:", error);
    return res.status(500).json({
      message: "Server error during branch deletion",
      error: error.message,
    });
  }
};
