import redis from "../Config/redis.js";
import userModel from "../models/UserSchema.js";
import buddyModel from "../models/BuddySchema.js";

export const verifyOtp = async (req, res, next) => {
  try {
    let { email, otp, role, type } = req.body;

    if (!email || !otp || !role || !type) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, role and type required"
      });
    }

    email = email.trim().toLowerCase();
    role = role.trim().toLowerCase();
    type = type.trim().toLowerCase();

    if (!["user", "buddy"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role"
      });
    }

    if (!["register", "login", "forgot"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP type"
      });
    }

    const Model = role === "buddy" ? buddyModel : userModel;

    const account = await Model.findOne({ email }).select("_id email");

    if (type === "register" && account) {
      return res.status(409).json({
        success: false,
        message:
          role === "buddy"
            ? "Buddy already exists"
            : "User already exists"
      });
    }

    if ((type === "login" || type === "forgot") && !account) {
      return res.status(404).json({
        success: false,
        message:
          role === "buddy"
            ? "Buddy not found"
            : "User not found"
      });
    }

    const otpKey = `otp:${role}:${type}:${email}`;
    const attemptKey = `otp_attempt:${role}:${type}:${email}`;

    const storedOtp = await redis.get(otpKey);

    if (!storedOtp) {
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please request a new OTP"
      });
    }

    let attempts = await redis.get(attemptKey);
    attempts = attempts ? Number(attempts) : 0;

    if (attempts >= 5) {
      await redis.del(otpKey);
      await redis.del(attemptKey);

      return res.status(429).json({
        success: false,
        message: "Too many wrong attempts. Please request new OTP"
      });
    }

    if (String(storedOtp) !== String(otp).trim()) {
      await redis.incr(attemptKey);
      await redis.expire(attemptKey, 300);

      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }

    if (type !== "forgot") {
      await redis.del(otpKey);
      await redis.del(attemptKey);
    }

    return res.status(200).json({
      success: true,
      message: "OTP verified",
      data: {
        email,
        role,
        type
      }
    });
  } catch (error) {
    console.log("❌ OTP VERIFY ERROR:", error);

    return next({
      statusCode: 500,
      message: "OTP verification failed"
    });
  }
};