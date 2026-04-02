
import instantBookingModel from "../models/instantBooking.js";
import { getIO } from "../services/chatSocket.js";

export const startWork = async (req, res, next) => {
  try {
    const { bookingId, otp } = req.body;
    const buddyId = req.user.id;

    const booking = await instantBookingModel
      .findById(bookingId)
      .select("+otp.start.code");

    if (!booking) {
      return res.status(404).json({ message: "Not found" });
    }

    if (booking.buddy.toString() !== buddyId) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (booking.status !== "arrived") {
      return res.status(400).json({ message: "Invalid state" });
    }

    const otpData = booking.otp.start;

    // ❌ Check existence
    if (!otpData || !otpData.code) {
      return res.status(400).json({ message: "OTP not generated" });
    }

    // ❌ Expiry check
    if (new Date() > otpData.expiresAt) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // ❌ Attempt limit
    if (otpData.attempts >= 3) {
      return res.status(400).json({ message: "Too many attempts" });
    }

    // ❌ Wrong OTP
    if (otpData.code !== otp) {
      booking.otp.start.attempts += 1;
      await booking.save();

      return res.status(400).json({ message: "Invalid OTP" });
    }

    // ✅ SUCCESS
    booking.status = "in-progress";
    booking.startedAt = new Date();

    // 🔥 clear OTP
    booking.otp.start = null;

    await booking.save();

    res.json({
      success: true,
      message: "Work started"
    });

  } catch (err) {
    next(err);
  }
};