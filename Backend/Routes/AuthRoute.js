import express from "express";
import { sendOtp } from "../otpContoller.js/sendOTP.js";
import { verifyOtp } from "../otpContoller.js/verifyOTP.js";
import { resetPasswordOtp } from "../Controllers/auth.js";
import { getAccessTokenFromRefresh } from "../Controllers/auth.js";
import { changePassword } from "../Controllers/auth.js";
import authMiddleware from "../middleware/authMiddleware.js";

const authRouter = express.Router();

// Send OTP
authRouter.post("/send-otp",sendOtp);

// Verify OTP (optional separate step)
authRouter.post("/verify-otp", verifyOtp);

authRouter.post("/refresh-token",getAccessTokenFromRefresh)

authRouter.post("/restPassword",authMiddleware,resetPasswordOtp)

authRouter.put("/change-password",authMiddleware,changePassword)

export default authRouter;