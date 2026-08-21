// controllers/schoolBranchController.js
import SchoolBranch from "../models/schoolsBranches.model.js";
import setResponse from "../services/helper.service.js";
import mongoose from "mongoose";
import { uploadFileToS3, deleteFileFromS3 } from "../services/aws.service.js";
import path from "path";
import { getCache, setCache, invalidateCache } from "../services/cache.service.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const CACHE_PREFIX = "school-branches";
const LIST_CACHE_KEY = `${CACHE_PREFIX}:all`;
const LIST_CACHE_TTL_MS = 60 * 1000;

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
        videosGallery = await Promise.all(
          req.files.videosGallery.map(async (file) => {
            const key = `videos/${Date.now()}-${file.originalname}`;
            const videoUrl = await uploadFileToS3(file.path, key, file.mimetype);
            return { title: file.originalname, videoUrl };
          })
        );
      }

      if (req.files.imagesGallery) {
        imagesGallery = await Promise.all(
          req.files.imagesGallery.map(async (file) => {
            const key = `images/${Date.now()}-${file.originalname}`;
            const imageUrl = await uploadFileToS3(file.path, key, file.mimetype);
            return { title: file.originalname, imageUrl };
          })
        );
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

    invalidateCache(CACHE_PREFIX);

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
    const cached = getCache(LIST_CACHE_KEY);
    if (cached) {
      return setResponse(res, {
        type: "success",
        message: "School branches retrieved successfully",
        data: cached,
      });
    }

    // .lean() skips Mongoose document hydration — faster to query and serialize.
    const branches = await SchoolBranch.find().lean();
    setCache(LIST_CACHE_KEY, branches, LIST_CACHE_TTL_MS);

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

    const cacheKey = `${CACHE_PREFIX}:${id}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return setResponse(res, {
        type: "success",
        message: "School branch retrieved successfully",
        data: cached,
      });
    }

    const branch = await SchoolBranch.findById(id).lean();
    if (!branch) {
      return setResponse(res, {
        type: "notFound",
        message: "School branch not found",
      });
    }

    setCache(cacheKey, branch, LIST_CACHE_TTL_MS);

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

    // 🧹 DELETE Removed Images + Videos from S3 (in parallel)
    const removedImages = (existingBranch.imagesGallery || []).filter(
      (img) => !incomingImageUrls.includes(img.imageUrl)
    );
    const removedVideos = (existingBranch.videosGallery || []).filter(
      (vid) => !incomingVideoUrls.includes(vid.videoUrl)
    );

    await Promise.all([
      ...removedImages.map((img) => {
        const s3Key = img.imageUrl.split(".amazonaws.com/")[1];
        return s3Key ? deleteFileFromS3(s3Key.replace("%2F", "/")) : Promise.resolve();
      }),
      ...removedVideos.map((vid) => {
        const s3Key = vid.videoUrl.split(".amazonaws.com/")[1];
        return s3Key ? deleteFileFromS3(s3Key.replace("%2F", "/")) : Promise.resolve();
      }),
    ]);

    // ✅ Keep URLs user wants to retain
    updatedImages = incomingImageUrls.map((url) => ({
      title: path.basename(url),
      imageUrl: url,
    }));

    updatedVideos = incomingVideoUrls.map((url) => ({
      title: path.basename(url),
      videoUrl: url,
    }));

    // 🆕 Add new uploaded files to updated arrays (in parallel)
    if (req.files) {
      if (req.files.imagesGallery) {
        const uploaded = await Promise.all(
          req.files.imagesGallery.map(async (file) => {
            const key = `images/${Date.now()}-${file.originalname}`;
            const imageUrl = await uploadFileToS3(
              path.resolve(file.path),
              key,
              file.mimetype
            );
            return { title: file.originalname, imageUrl };
          })
        );
        updatedImages.push(...uploaded);
      }

      if (req.files.videosGallery) {
        const uploaded = await Promise.all(
          req.files.videosGallery.map(async (file) => {
            const key = `videos/${Date.now()}-${file.originalname}`;
            const videoUrl = await uploadFileToS3(
              path.resolve(file.path),
              key,
              file.mimetype
            );
            return { title: file.originalname, videoUrl };
          })
        );
        updatedVideos.push(...uploaded);
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

    invalidateCache(CACHE_PREFIX);

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

    // 🔥 Delete all images and videos from S3 (in parallel)
    const imageDeletes = Array.isArray(branch.imagesGallery)
      ? branch.imagesGallery
          .filter((img) => img.imageUrl)
          .map((img) => {
            const key = img.imageUrl.split(".amazonaws.com/")[1];
            return deleteFileFromS3(key.replace("%2F", "/"));
          })
      : [];

    const videoDeletes = Array.isArray(branch.videosGallery)
      ? branch.videosGallery
          .filter((vid) => vid.videoUrl)
          .map((vid) => {
            const key = vid.videoUrl.split(".amazonaws.com/")[1];
            return deleteFileFromS3(key.replace("%2F", "/"));
          })
      : [];

    await Promise.all([...imageDeletes, ...videoDeletes]);

    // ❌ Delete the document from DB
    await branch.deleteOne();
    invalidateCache(CACHE_PREFIX);

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
