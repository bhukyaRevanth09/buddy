import { getIO } from "../services/Socket.js";
import instantBookingModel from "../models/instantBooking.js";
import { generateOTP } from "../utils/otpGenrate.js";

export const markArrived = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const buddyId = req.user.id;

    const booking = await instantBookingModel.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.buddy.toString() !== buddyId) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (booking.status !== "accepted") {
      return res.status(400).json({ message: "Invalid state" });
    }

    /*
    ========================
    GENERATE OTP
    ========================
    */
    const otp = generateOTP();

    booking.status = "arrived";
    booking.arrivedAt = new Date();

    booking.otp.start = {
      code: otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attempts: 0
    };

    await booking.save();

    const io = getIO();

    /*
    ========================
    USER NOTIFICATION
    ========================
    */

    io.to(booking.user.toString()).emit("booking_arrived", {
      bookingId,
      status: "arrived",
      arrivedAt: booking.arrivedAt
    });

    /*
    ========================
    OTP EVENT (SECURE VERSION)
    ========================
    */
    io.to(booking.user.toString()).emit("booking_otp_generated", {
      bookingId,
      // ⚠️ DO NOT SEND OTP IN PRODUCTION
      otp: process.env.NODE_ENV === "development" ? otp : undefined
    });

    /*
    ========================
    TRACKING ROOM UPDATE
    ========================
    */

    io.to(`booking:${bookingId}`).emit("booking_status_update", {
      bookingId,
      status: "arrived"
    });

    return res.json({
      success: true,
      message: "Buddy arrived. OTP generated"
    });

  } catch (err) {
    next(err);
  }
};