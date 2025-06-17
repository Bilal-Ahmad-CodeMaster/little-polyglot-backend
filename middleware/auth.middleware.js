import jwt from "jsonwebtoken";
import helper from "../services/helper.service.js";
import User from "../models/user.model.js";

// Middleware to verify JWT and add user to request object
const JWTVerify = async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "").trim();

    if (!token) {
      return helper(res, {
        type: "unauthorized",
        message: "Unauthorized user",
      });
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken._id).select("-password");

    if (!user) {
      return helper(res, { type: "notFound", message: "User not found" });
    }

    req.user = user; // Attach the user to the request object
    console.log("JWTVerify: User attached to request:", req.user); // Debug log
    next();
  } catch (error) {
    return helper(res, {
      type: "unauthorized",
      message: "Invalid Token. Access Denied.",
    });
  }
};
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.userType;

    console.log(
      "checkRole: Required roles:",
      allowedRoles,
      "User role:",
      userRole
    );

    if (!userRole || !allowedRoles.includes(userRole)) {
      return helper(res, {
        type: "unauthorized",
        message: "Access Forbidden. You do not have permission.",
      });
    }

    next();
  };
};


export { JWTVerify, checkRole };
