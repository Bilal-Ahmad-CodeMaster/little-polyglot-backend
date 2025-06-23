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
    } = req.body;

    if (
      !region ||
      !city ||
      !schoolName ||
      !googleLocation ||
      !contactInfo ||
      !schoolDetail ||
      !franchiseDetails ||
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
      // Handle videos
      if (req.files.videosGallery) {
        for (const file of req.files.videosGallery) {
          const key = `videos/${Date.now()}-${file.originalname}`;
          const videoUrl = await uploadFileToS3(file.path, key, file.mimetype);
          videosGallery.push({ title: file.originalname, videoUrl });
        }
      }

      // Handle images
      if (req.files.imagesGallery) {
        for (const file of req.files.imagesGallery) {
          const key = `images/${Date.now()}-${file.originalname}`;
          const imageUrl = await uploadFileToS3(file.path, key, file.mimetype);
          imagesGallery.push({ title: file.originalname, imageUrl });
        }
      }
    }

    const newBranch = await SchoolBranch.create({
      region,
      city,
      annotation,
      schoolName,
      googleLocation,
      contactInfo,
      priceList,
      schoolDetail,
      BranchEvents,
      franchiseDetails,
      SEOBaseAdditionalInfo,
      extraInfoModal,
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

// UPDATE
export const updateSchoolBranch = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return setResponse(res, {
        type: "bad",
        message: "Invalid ID format",
      });
    }

    const existingBranch = await SchoolBranch.findById(id);
    if (!existingBranch) {
      return setResponse(res, {
        type: "notFound",
        message: "School branch not found",
      });
    }

    let updatedVideos = [...(existingBranch.videosGallery || [])];
    let updatedImages = [...(existingBranch.imagesGallery || [])];

    if (req.files) {
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
    }

    const updatedData = {
      region: req.body.region || existingBranch.region,
      city: req.body.city || existingBranch.city,
      annotation: req.body.annotation || existingBranch.annotation,
      schoolName: req.body.schoolName || existingBranch.schoolName,
      googleLocation: req.body.googleLocation || existingBranch.googleLocation,
      imageGalleryAboutUsDescription:
        req.body.imageGalleryAboutUsDescription ||
        existingBranch.imageGalleryAboutUsDescription,
      contactInfo: req.body.contactInfo || existingBranch.contactInfo,
      priceList: req.body.priceList || existingBranch.priceList,
      schoolDetail: req.body.schoolDetail || existingBranch.schoolDetail,
      BranchEvents: req.body.BranchEvents || existingBranch.BranchEvents,
      franchiseDetails:
        req.body.franchiseDetails || existingBranch.franchiseDetails,
      SEOBaseAdditionalInfo:
        req.body.SEOBaseAdditionalInfo || existingBranch.SEOBaseAdditionalInfo,
      extraInfoModal: req.body.extraInfoModal || existingBranch.extraInfoModal,
      videosGallery: updatedVideos,
      imagesGallery: updatedImages,
    };

    const updatedBranch = await SchoolBranch.findByIdAndUpdate(
      id,
      updatedData,
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

    if (!isValidObjectId(id)) {
      return setResponse(res, {
        type: "bad",
        message: "Invalid ID format",
      });
    }

    const deleted = await SchoolBranch.findByIdAndDelete(id);
    if (!deleted) {
      return setResponse(res, {
        type: "notFound",
        message: "School branch not found",
      });
    }

    return setResponse(res, {
      type: "success",
      message: "School branch deleted successfully",
    });
  } catch (error) {
    return setResponse(res, {
      type: "error",
      message: error.message,
    });
  }
};

export const deleteMediaFromBranch = async (req, res) => {
  try {
    const { id, mediaType, mediaId } = req.params;

    if (!isValidObjectId(id) || !isValidObjectId(mediaId)) {
      return setResponse(res, {
        type: "bad",
        message: "Invalid IDs provided.",
      });
    }

    if (!["images", "videos"].includes(mediaType)) {
      return setResponse(res, {
        type: "bad",
        message: "mediaType must be 'images' or 'videos'.",
      });
    }

    const branch = await SchoolBranch.findById(id);
    if (!branch) {
      return setResponse(res, {
        type: "notFound",
        message: "School branch not found.",
      });
    }

    const galleryField =
      mediaType === "images" ? "imagesGallery" : "videosGallery";
    const mediaArray = branch[galleryField] || [];
    const idx = mediaArray.findIndex((m) => m._id.equals(mediaId));
    if (idx === -1) {
      return setResponse(res, {
        type: "notFound",
        message: `${mediaType.slice(0, -1)} not found.`,
      });
    }

    const [removed] = mediaArray.splice(idx, 1);
    branch[galleryField] = mediaArray;
    await branch.save();

    // Clean up from S3
    try {
      const url = mediaType === "images" ? removed.imageUrl : removed.videoUrl;
      console.log(url);
      // Extract the key from the S3 URL
      const s3BaseUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`;
      let key = url.startsWith(s3BaseUrl)
        ? url.substring(s3BaseUrl.length)
        : url.split(".amazonaws.com/")[1];
      key = decodeURIComponent(key);
      console.log(key);
      await deleteFileFromS3(key);
    } catch (s3err) {
      console.warn(
        "Media removed from DB but failed to delete from S3:",
        s3err.message
      );
    }

    return setResponse(res, {
      type: "success",
      message: `${mediaType.slice(0, -1)} deleted successfully.`,
    });
  } catch (err) {
    console.error("deleteMediaFromBranch error:", err);
    return setResponse(res, { type: "error", message: err.message });
  }
};
