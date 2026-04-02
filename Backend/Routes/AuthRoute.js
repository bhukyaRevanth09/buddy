import express from "express";
import { sendOtp } from "../otpContoller.js/sendOTP.js";
import { verifyOtp } from "../otpContoller.js/verifyOTP.js";
import { resetPasswordOtp } from "../Controllers/auth.js";

const authRouter = express.Router();

// Send OTP
authRouter.post("/send-otp",sendOtp);

// Verify OTP (optional separate step)
authRouter.post("/verify-otp", verifyOtp);


authRouter.post("/restPassword",resetPasswordOtp)

export default authRouter;