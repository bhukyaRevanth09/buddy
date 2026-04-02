import express from "express";
import { buddyLoginOtp,buddyLoginPassword,buddyProfile,buddyReg } from "../Controllers/auth.js";
import { changePassword } from "../Controllers/auth.js";
import authMiddleware from "../middleware/authMiddleware.js";

const buddyRouter = express.Router();

// register

buddyRouter.post("/buddy-register", buddyReg);

//  Login
buddyRouter.post("/buddy-login-otp", buddyLoginOtp); // OTP login
buddyRouter.post("/buddy-login", buddyLoginPassword);          // Password login

// Profile
buddyRouter.get("/buddy-profile", authMiddleware, buddyProfile);

//  Change Password
buddyRouter.post("/change-password", authMiddleware, changePassword);

export default buddyRouter;