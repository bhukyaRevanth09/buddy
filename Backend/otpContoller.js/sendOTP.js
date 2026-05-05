import redis from "../Config/redis.js";
import { generateOTP } from "../utils/otpGenrate.js";
import buddyModel from "../models/BuddySchema.js";
import userModel from "../models/UserSchema.js";
import { sendEmail } from "../services/emailServices.js";

export const sendOtp = async (req, res, next) => {
  console.log('send OTP ::')
  try {
    const { email, type, role } = req.body;

    // 🔹 Validation
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email required",
      });
    }

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role required",
      });
    }

    // 🔥 Select model
    const Model = role === "buddy" ? buddyModel : userModel;

    // 🔍 Check user
    const existingUser = await Model.findOne({ email });

    // REGISTER 
    if (type === "register" && existingUser) {
      return res.status(409).json({
        success: false,
        message: `${role} already exists`,
      });
    }

    // LOGIN / FORGOT
    if ((type === "login" || type === "forgot") && !existingUser) {
      return res.status(404).json({
        success: false,
        message: `${role} not found`,
      });
    }

    //  Redis keys
    const key = `otp:${email}`;
    const limitKey = `otp_limit:${email}`;
 console.log("keeeeeeeeeeeeeeeeeey::",key)
    //  Rate limit
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

    // 📧 Send Email
    try {
     await sendEmail({
  email,
  otp,
  subject: "Verify your email - OTP",
  title: "Verify your email",
  message: "Use this OTP to continue"
});
    } catch (err) {
      console.log("⚠️ Email failed, fallback to console");
    }

    // 🔥 Dev log
    console.log(`📧 OTP for ${email}:`, otp);

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