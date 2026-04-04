import redis from "../Config/redis.js";
import { generateOTP } from "../utils/otpGenrate.js";
import buddyModel from "../models/BuddySchema.js";
import userModel from "../models/UserSchema.js";

export const sendOtp = async (req, res, next) => {
  console.log(req.body)
  try {
    const { phone, type, role } = req.body;

    // 🔹 Validation
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone or Email required",
      });
    }

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role required",
      });
    }

    // 🔥 Select model based on role
    const Model = role === "buddy" ? buddyModel : userModel;

    // 🔍 Check existing user
    const existingUser = await Model.findOne({phone});

    // 🔥 REGISTER FLOW
    if (type === "register" && existingUser) {
      return res.status(409).json({
        success: false,
        message: `${role} already exists`,
      });
    }

    // 🔥 LOGIN / FORGOT FLOW
    if ((type === "login" || type === "forgot") && !existingUser) {
      return res.status(404).json({
        success: false,
        message: `${role} not found`,
      });
    }

    // 🔥 Create Redis Key (phone/email based)
    const key = phone ? `otp:${phone}` : `otp:${email}`;
    const limitKey = phone
      ? `otp_limit:${phone}`
      : `otp_limit:${email}`;

    // 🚫 Rate limit (1 min)
    const limit = await redis.get(limitKey);
    if (limit) {
      return res.status(429).json({
        success: false,
        message: "Too many requests. Try after 1 min",
      });
    }

    // 🔢 Generate OTP
    const otp = generateOTP();

    // 🧠 Store OTP (5 min)
    await redis.set(key, otp, "EX", 300);

    // 🚫 Set rate limit
    await redis.set(limitKey, 1, "EX", 60);

    console.log(`📲 OTP for ${phone || email}:`, otp);

    // 👉 TODO: Integrate SMS / Email service

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });

  } catch (error) {
    console.log(error);
    next({
      statusCode: 500,
      message: "Send OTP failed",
    });
  }
};