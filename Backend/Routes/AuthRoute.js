import express from "express";

import { sendOtp } from "../otpContoller.js/sendOTP.js";
import { verifyOtp } from "../otpContoller.js/verifyOTP.js";

import {
  resetPassword,
  getAccessTokenFromRefresh,
  changePassword
} from "../Controllers/auth.js";

import authMiddleware from "../middleware/authMiddleware.js";

const authRouter = express.Router();

authRouter.post("/send-otp", sendOtp);
authRouter.post("/verify-otp", verifyOtp);

authRouter.post("/refresh-token", getAccessTokenFromRefresh);

// Forgot password: no authMiddleware needed
authRouter.post("/reset-password", resetPassword);

// Old typo route support, optional
authRouter.post("/restPassword", resetPassword);
authRouter.post("/reset-Password", resetPassword);

// Logged-in user/buddy change password
authRouter.put("/change-password", authMiddleware, changePassword);

export default authRouter;