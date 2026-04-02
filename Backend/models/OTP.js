import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  contact: String, // phone or email
  otp: String,
  expiresAt: Date,
  verified: {
    type: Boolean,
    default: false
  }
});

const OTP =  mongoose.model("OTP", otpSchema);
export default OTP