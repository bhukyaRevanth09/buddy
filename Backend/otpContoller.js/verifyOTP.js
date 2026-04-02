import OTP from "../models/OTP.js";

export const verifyOtp = async (req, res, next) => {
  try {
    const { contact, otp } = req.body;

    const record = await OTP.findOne({ contact });

    if (!record) {
      return next({ statusCode: 400, message: "OTP not found" });
    }

    if (record.otp !== otp) {
      return next({ statusCode: 400, message: "Invalid OTP" });
    }

    if (record.expiresAt < new Date()) {
      return next({ statusCode: 400, message: "OTP expired" });
    }

    record.verified = true;
    await record.save();

    res.status(200).json({ message: "OTP verified" });

  } catch (error) {
    next({ statusCode: 500, message: "OTP verify error" });
  }
};