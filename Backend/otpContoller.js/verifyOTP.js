import redis from "../Config/redis.js";
import userModel from "../models/UserSchema.js";
import buddyModel from "../models/BuddySchema.js";

export const verifyOtp = async (req, res, next) => {
  console.log(req?.body)
  try {
    const { email, otp, role, type } = req.body;

    if (!email || !otp || !role || !type) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, role and type required",
      });
    }

    const key = `otp:${email}`;

    // get otp from redis
    const storedOtp = await redis.get(key);

    if (!storedOtp) {
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    // compare otp
    if (String(storedOtp) !== String(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // delete otp after success
    await redis.del(key);

    // choose model
    const Model = role === "buddy" ? buddyModel : userModel;

    // REGISTER
    if (type === "register") {
      const existing = await Model.findOne({ email });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: `${role} already exists`,
        });
      }

      return res.status(200).json({
        success: true,
        message: "OTP verified",
      });
    }

    // LOGIN / FORGOT
    if (type === "login" || type === "forgot") {
      const user = await Model.findOne({ email });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: `${role} not found`,
        });
      }

      return res.status(200).json({
        success: true,
        message: "OTP verified",
      });
    }

  } catch (error) {
    console.log(error);
    next({
      statusCode: 500,
      message: "OTP verification failed",
    });
  }
};