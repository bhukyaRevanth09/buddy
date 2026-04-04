import redis from "../Config/redis.js";
import userModel from "../models/UserSchema.js";
import buddyModel from "../models/BuddySchema.js";

export const verifyOtp = async (req, res, next) => {
  try {
    const { phone, email, otp, role, type } = req.body;
    console.log(req.body)
    //  Validation
    if ((!phone && !email) || !otp || !role) {
      return res.status(400).json({
        success: false,
        message: "Phone/Email, OTP and role required",
      });
    }

    // Create Redis Key
    const key = phone ? `otp:${phone}` : `otp:${email}`;

    //  Get OTP
    const storedOtp = await redis.get(key);

    if (!storedOtp) {
      return res.status(400).json({
        success: false,
        message: "OTP expired or not found",
      });
    }

    if (storedOtp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    //  Delete OTP after success
    await redis.del(key);

    // 🔥 Select Model (User / Buddy)
    const Model = role === "buddy" ? buddyModel : userModel;

    // 🔍 Find user (for login / forgot)
    if (type === "login" || type === "forgot") {
      const user = await userModel.findOne({
        $or: [{ phone }, { email }],
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: `${role} not found`,
        });
      }
    }

    // 🔍 Check duplicate (for register)
    if (type === "register") {
      const existing = await Model.findOne({
        $or: [{ phone }, { email }],
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: `${role} already exists`,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });

  } catch (error) {
    console.log(error);
    next({ statusCode: 500, message: "OTP verify error" });
  }
};