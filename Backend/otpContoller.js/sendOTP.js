import redis from "../Config/redis.js";
import { generateOTP } from "../utils/otpGenrate.js";
import buddyModel from "../models/BuddySchema.js";
import userModel from "../models/UserSchema.js";
import { sendEmail } from "../services/emailServices.js";

export const sendOtp = async (req, res, next) => {
  console.log(" SEND OTP API CALLED");

  try {
    let { email, type, role } = req.body;

    /*
   
    BASIC VALIDATION
    
    */

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    email = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address"
      });
    }

    if (!role || typeof role !== "string") {
      return res.status(400).json({
        success: false,
        message: "Role is required"
      });
    }

    role = role.trim().toLowerCase();

    const allowedRoles = ["user", "buddy"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role"
      });
    }

    if (!type || typeof type !== "string") {
      return res.status(400).json({
        success: false,
        message: "OTP type is required"
      });
    }

    type = type.trim().toLowerCase();

    const allowedTypes = ["register", "login", "forgot"];

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP type"
      });
    }

    /*
  
    SELECT MODEL
    
    */

    const Model = role === "buddy" ? buddyModel : userModel;

    const existingUser = await Model.findOne({ email }).select("_id email");

    /*
  
    USER / BUDDY EXISTENCE CHECK
   
    */

    if (type === "register" && existingUser) {
      return res.status(409).json({
        success: false,
        message:
          role === "buddy"
            ? "Buddy already exists with this email"
            : "User already exists with this email"
      });
    }

    if ((type === "login" || type === "forgot") && !existingUser) {
      return res.status(404).json({
        success: false,
        message:
          role === "buddy"
            ? "Buddy account not found"
            : "User account not found"
      });
    }

    /*
   
    REDIS KEYS
    
    */

    const otpKey = `otp:${role}:${type}:${email}`;
    const countKey = `otp_count:${role}:${type}:${email}`;
    const blockKey = `otp_block:${role}:${type}:${email}`;
    const attemptKey = `otp_attempt:${role}:${type}:${email}`;

    /*

    RATE LIMIT
    3 OTP sends allowed
    4th request blocked for 5 min
    
    */

    const isBlocked = await redis.get(blockKey);

    if (isBlocked) {
      return res.status(429).json({
        success: false,
        message: "Too many OTP requests. Try again after 5 minutes"
      });
    }

    let count = await redis.get(countKey);
    count = count ? Number(count) : 0;

    if (count >= 3) {
      await redis.set(blockKey, "1", "EX", 300);
      await redis.del(countKey);

      return res.status(429).json({
        success: false,
        message: "Too many OTP requests. Try again after 5 minutes"
      });
    }

    
    
    // GENERATE OTP
   
    

    const otp = generateOTP();

    /*

    STORE OTP
    OTP valid: 5 minutes
    Request count window: 10 minutes
    
    */

    await redis.set(otpKey, otp, "EX", 300);

    const newCount = await redis.incr(countKey);

    if (newCount === 1) {
      await redis.expire(countKey, 600);
    }

    await redis.del(attemptKey);

    /*

    EMAIL CONTENT
    
    */

    let subject = "Verify your email - OTP";
    let title = "Verify your email";
    let message = "Use this OTP to continue";

    if (type === "forgot") {
      subject = "Reset your password - OTP";
      title = "Reset your password";
      message = "Use this OTP to reset your password";
    }

    if (type === "login") {
      subject = "Login verification - OTP";
      title = "Login verification";
      message = "Use this OTP to login securely";
    }

    /*
   
    SEND EMAIL
    
    */

    try {
      await sendEmail({
        email,
        otp,
        subject,
        title,
        message
      });
    } catch (err) {
      console.log("⚠️ EMAIL SEND FAILED:", err.message);
    }

    /*
 
    DEV LOG ONLY

    */

    if (process.env.NODE_ENV !== "production") {
      console.log(`📧 OTP for ${role} ${type} ${email}: ${otp}`);
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      data: {
        email,
        role,
        type,
        expiresIn: 300,
        requestCount: newCount,
        remainingRequests: Math.max(0, 3 - newCount)
      }
    });
  } catch (error) {
    console.log(" SEND OTP ERROR:", error);

    return next({
      statusCode: 500,
      message: "Send OTP failed"
    });
  }
};