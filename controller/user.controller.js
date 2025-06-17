import User from "../models/user.model.js";
import helper from "../services/helper.service.js";
import { deleteFileFromS3, uploadFileToS3 } from "../services/aws.service.js";



const myProfile = async (req, res) => {
  const id = req.user._id;
  if (!id) {
    return helper(res, {
      type: "unauthorized",
      message: "Unauthorized access  ",
    });
  }
  try {
    let profile = await User.findById(id).select("-password");


    if (!profile) {
      return helper(res, {
        type: "notFound",
        message: "User profile not found.",
      });
    }

    return helper(res, {
      type: "success",
      message: "User profile fetched successfully",
      data: profile,
    });
  } catch (error) {
    return helper(res, {
      type: "error",
      message: "Error occur in fetching User profile",
      data: error.message,
    });
  }
};

const updateMyProfile = async (req, res) => {
  const {
    username,
    email,
  } = req.body;
  const id = req.user._id;
  if (!id) {
    return helper(res, {
      type: "unauthorized",
      message: "Unauthorized access  ",
    });
  }
    try {
      const existedUser = await User.findById(id);
      if (!existedUser) {
        return helper(res, {
        type: "unauthorized",
        message: "Unauthorized User, please sign in first.",
        });
      }

      // Check if username already exists (and is not the current user's)
      if (username && username !== existedUser.username) {
        const usernameExists = await User.findOne({ username, _id: { $ne: id } });
        if (usernameExists) {
        return helper(res, {
          type: "error",
          message: "Username already exists. Please choose another.",
        });
        }
      }

      // Check if email already exists (and is not the current user's)
      if (email && email !== existedUser.email) {
        const emailExists = await User.findOne({ email, _id: { $ne: id } });
        if (emailExists) {
        return helper(res, {
          type: "error",
          message: "Email already exists. Please use another.",
        });
        }
      }

    if (req.file) {
      const filePath = req.file.path;
      const fileKey = `uploads/${Date.now()}_${req.file.originalname}`;

      // Upload new profile image to S3
      const profileUrl = await uploadFileToS3(
        filePath,
        fileKey,
        req.file.mimetype
      );
      if (!profileUrl) {
        throw new Error("File upload failed.");
      }

      // If there's an existing profile image, delete it from S3
      if (existedUser.profileUrl) {
        const key = existedUser.profileUrl.split(
          `${process.env.AWS_BUCKET_NAME}/`
        )[1];
        if (key) {
          await deleteFileFromS3(key);
        }
      }

      existedUser.profileUrl = profileUrl;
    }

    // Update user fields
    if (username) existedUser.username = username;
    if (email) existedUser.email = email;
 

    // Save updated user
    const updatedUser = await existedUser.save();

    return helper(res, {
      type: "success",
      message: "User profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error.message);

    return helper(res, {
      type: "error",
      message: "Error occurred while updating profile.",
      data: error.message,
    });
  }
};

const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const id = req.user._id;
  if (!id) {
    return helper(res, {
      type: "unauthorized",
      message: "Unauthorized access",
    });
  }
  try {
    const existedUser = await User.findById(id);
    if (!existedUser) {
      return helper(res, {
        type: "notFound",
        message: "Unauthorized, User not found.  ",
      });
    }

    const validPassword = await existedUser.comparePassword(oldPassword);
    if (!validPassword) {
      return helper(res, {
        type: "error",
        message: "Password is Invalid. Please enter valid password",
      });
    }

    existedUser.password = newPassword;
    await existedUser.save();
    return helper(res, {
      type: "success",
      message: "Password Changed successfully",
    });
  } catch (error) {
    return helper(res, {
      type: "error",
      message: "Error occur in changing password",
      data: error.message,
    });
  }
};








export {
  myProfile,
  updateMyProfile,
  changePassword,

};
