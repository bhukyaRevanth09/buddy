import instantBookingModel from "../models/instantBooking.js";
import buddyModel from "../models/BuddySchema.js";
import { getIO } from "../services/chatSocket.js";

export const completeWork = async (req, res, next) => {
  try {
    const io = getIO();
    const { bookingId, otp } = req.body;
    const buddyId = req.user.id;

    const booking = await instantBookingModel
      .findById(bookingId)
      .select("+otp.complete.code");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // ❗ Only assigned buddy
    if (booking.buddy.toString() !== buddyId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // ❗ Correct state
    if (booking.status !== "in-progress") {
      return res.status(400).json({ message: "Invalid state" });
    }

    // 🔐 OPTIONAL OTP CHECK
    if (booking.otp?.complete?.code) {

      if (new Date() > booking.otp.complete.expiresAt) {
        return res.status(400).json({ message: "OTP expired" });
      }

      if (booking.otp.complete.code !== otp) {
        return res.status(400).json({ message: "Invalid OTP" });
      }
    }

    // ✅ COMPLETE BOOKING
    booking.status = "completed";
    booking.completedAt = new Date();

    // 💳 PAYMENT UPDATE
    booking.payment.status = "paid";

    // 🔥 CLEAR OTP
    booking.otp.complete = null;

    await booking.save();

    // 💰 UPDATE BUDDY EARNINGS
    await buddyModel.findByIdAndUpdate(buddyId, {
      $inc: {
        "earnings.total": booking.pricing.totalAmount,
        totalBooking: 1
      },
      $set: {
        availabilityStatus: "available",
        currentBooking: null
      }
    });

    // 📡 NOTIFY USER
    io.to(booking.user.toString()).emit("work-completed", {
      bookingId,
      message: "Work completed successfully"
    });

    return res.json({
      success: true,
      message: "Work completed",
      booking
    });

  } catch (error) {
    next(error);
  }
};