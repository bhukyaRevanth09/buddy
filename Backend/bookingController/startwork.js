import instantBookingModel from "../models/instantBooking.js";
import { getIO } from "../services/Socket.js";

export const startWork = async (req, res) => {
  try {
    const { bookingId, otp } = req.body;
    const buddyId = req.user.id;

    const booking = await instantBookingModel.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    // 1. ONLY ARRIVED CAN START
    if (booking.status !== "arrived") {
      return res.status(400).json({
        success: false,
        message: "Buddy must arrive first"
      });
    }

    // 2. OTP CHECK (IMPORTANT)
    const validOtp = booking?.otp?.start?.code;
    const expiresAt = booking?.otp?.start?.expiresAt;

    if (!otp || otp !== validOtp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }

    if (new Date() > expiresAt) {
      return res.status(400).json({
        success: false,
        message: "OTP expired"
      });
    }

    // 3. UPDATE STATUS
    booking.status = "started";
    booking.startedAt = new Date();

    await booking.save();

    const io = getIO();

    // 4. SOCKET EVENTS (CONSISTENT)
    io.to(booking.user.toString()).emit("tracking_started", {
      bookingId,
      status: "started"
    });

    io.to(`booking:${bookingId}`).emit("booking-status-update", {
      bookingId,
      status: "started"
    });

    return res.status(200).json({
      success: true,
      message: "Work started successfully",
      booking
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};