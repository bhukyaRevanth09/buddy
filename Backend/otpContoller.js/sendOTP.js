import redis from "../Config/redis.js";
import { generateOTP } from "../utils/otpGenrate.js";

export const sendOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number required"
      });
    }

    // 🔐 Generate OTP
    const otp = generateOTP();

    // ⏳ Store in Redis (5 minutes expiry)
    await redis.set(
      `otp:${phone}`,
      otp,
      "EX",
      300 // 5 minutes
    );

    console.log(`📲 OTP for ${phone}:`, otp); // 👈 remove in production

    // 📩 Send SMS (mock)
    // Replace with real SMS API later
    // await sendSMS(phone, otp);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully"
    });

  } catch (error) {
    next(error);
  }
};