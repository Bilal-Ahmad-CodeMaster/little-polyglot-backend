import User from "../models/user.model.js";
import helper from "../services/helper.service.js";
import { uploadFileToS3 } from "../services/aws.service.js";
import  sendOtpEmail  from "../services/sendMailOTP.service.js";
const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const signUpController = async (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password || !role || !req.file) {
    return helper(res, {
      type: "bad",
      message: "Username, Email, Role, user profile and Password are required",
    });
  }
  try {
    const existedUser = await User.findOne({
      $or: [{ username }, { email }],
    });
    if (existedUser) {
      return helper(res, {
        type: "notFound",
        message:
          "User already Exist. Please retry and Try to enter Different email and username both must be unique.",
      });
    }
    const filePath = req.file.path;
    const fileKey = `uploads/${Date.now()}_${req.file.originalname}`;

    const profileUrl = await uploadFileToS3(
      filePath,
      fileKey,
      req.file.mimetype
    );

    console.log(profileUrl);
    await User.create({
      username,
      email,
      profileUrl,
      password,
      role,
    });
    return helper(res, {
      type: "success",
      message: "User SignUp successfully",
    });
  } catch (error) {
    return helper(res, {
      type: "error",
      message: "Error occur in user SignUp",
    });
  }
};
const signinController = async (req, res) => {
  const { username, email, password } = req.body;

  if ((!username && !email) || !password) {
    return helper(res, {
      type: "bad",
      message: "Username or Email and Password are required",
    });
  }
  try {
    const existedUser = await User.findOne({
      $or: [{ username }, { email }],
    });
    if (!existedUser) {
      return helper(res, {
        type: "notFound",
        message: "User not found.",
      });
    }
    if (existedUser.role !== "ADMIN") {
      return helper(res, {
        type: "notFound",
        message: "Only Admin can access this.",
      });
    }
    const passwordValid = await existedUser.comparePassword(password);
    if (!passwordValid) {
      return helper(res, {
        type: "bad",
        message: "Password is not Valid. Please enter Valid Password",
      });
    }
    const accessToken = await existedUser.generateAccessToken();
    existedUser.isLoggedIn = true;
  
    const loggedInUser = await existedUser.save();
    // Exclude password and otp fields from the response
    loggedInUser.password = undefined;
    loggedInUser.otp = undefined;
    if (!accessToken) {
      return helper(res, {
        type: "bad",
        message: "Error Generating Access Token",
      });
    }
    const options = {
      httpOnly: true,
      maxAge: 3600000 * 24,
      secure: true,
    };

    // Set the cookie
    res.cookie("accessToken", accessToken, options);
    return helper(res, {
      type: "success",
      message: "User Signin successfully",
      data: {
        data: loggedInUser,
        accessToken: accessToken,
      },
    });
  } catch (error) {
    return helper(res, {
      type: "error",
      message: "Error occur in user Signin",
      data: error.message,
    });
  }
};

const signOutController = async (req, res) => {
  const id = req.user._id;
  if (!id) {
    helper(res, {
      type: "unauthorized",
      message: "Unauthorized access  ",
    });
  }
  try {
    const loggedInUser = await User.findById(id);
    if (!loggedInUser) {
      return helper(res, {
        type: "notFound",
        message: "Unauthorize user not found",
      });
    }

    loggedInUser.isLoggedIn = false;
    await loggedInUser.save();
    const options = {
      httpOnly: true,
      secure: true,
    };

    res.clearCookie("accessToken", options);
    return helper(res, {
      type: "success",
      message: "User signout successfully",
    });
  } catch (error) {
    return helper(res, {
      type: "error",
      message: "Error occur in user SignOut",
      data: error.message,
    });
  }
};
const sendOtp = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email }).select("-password");

    if (!user) {
      return helper(res, {
        type: "notFound",
        message: "User not Found. Try Again with different email",
      });
    }

    const otp = generateOtp();
    const sent = await sendOtpEmail(email, otp);
    if (!sent) {
      return helper(res, {
        type: "error",
        message: "Error sending OTP email",
      });
    }

    // Store OTP in user's document (or in-memory store)
    user.otp = otp;
    await user.save();

    return helper(res, { type: "success", message: `Otp send to ${email}` });
  } catch (error) {
    return helper(res, {
      type: "error",
      message: "Error occur in user Forgot Password",
      data: error.message,
    });
  }
};

const verifyOtpAndResetPassword = async (req, res) => {
  const { email, otp, password, confirmPassword } = req.body;

  if (!email || !otp || !password || !confirmPassword) {
    return helper(res, {
      type: "bad",
      message: "Email, OTP, password, and confirmPassword are required",
    });
  }

  if (password !== confirmPassword) {
    return helper(res, {
      type: "bad",
      message: "Password and confirmPassword do not match",
    });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return helper(res, {
        type: "notFound",
        message: "User not found. Try again with a different email",
      });
    }

    if (!user.otp || user.otp !== otp) {
      return helper(res, {
        type: "bad",
        message: "Invalid or expired OTP",
      });
    }

    user.password = password;
    user.otp = undefined; // Clear OTP after use
    await user.save();

    return helper(res, {
      type: "success",
      message: "OTP verified and password reset successfully",
    });
  } catch (error) {
    return helper(res, {
      type: "error",
      message: "Error occurred during OTP verification or password reset",
      data: error.message,
    });
  }
};

export {
  signUpController,
  signinController,
  signOutController,

  sendOtp,
  verifyOtpAndResetPassword
};
