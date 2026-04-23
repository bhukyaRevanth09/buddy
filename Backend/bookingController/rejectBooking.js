import instantBookingModel from "../models/instantBooking.js";
import buddyModel from "../models/BuddySchema.js";
import redis from "../Config/redis.js";
import { getIO } from "../services/Socket.js";

export const cancelBooking = async (req, res, next) => {
  try {
    const io = getIO();
    const { bookingId, reason } = req.body;
    const userId = req.user.id;
    const role = req.user.role;

    const booking = await instantBookingModel.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    if (["completed", "cancelled"].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: "Booking already finished"
      });
    }

    /*
    =========================
    UPDATE STATUS
    =========================
    */

    booking.status = "cancelled";
    booking.cancelledAt = new Date();

    booking.cancellation = {
      cancelledBy: role,
      reason: reason || `Cancelled by ${role}`
    };

    await booking.save();

    /*
    =========================
    STOP AUTO ASSIGN
    =========================
    */

    await redis.del(`pending_booking:${bookingId}`);

    /*
    =========================
    FREE BUDDY
    =========================
    */

    if (booking.buddy) {
      await buddyModel.findByIdAndUpdate(booking.buddy, {
        availabilityStatus: "available",
        currentBooking: null
      });
    }

    /*
    =========================
    NOTIFY USER
    =========================
    */

    io.to(booking.user.toString()).emit("booking-cancelled", {
      bookingId,
      cancelledBy: role,
      reason: booking.cancellation.reason
    });

    /*
    =========================
    NOTIFY BUDDY
    =========================
    */

    if (booking.buddy) {
      io.to(booking.buddy.toString()).emit("booking-cancelled", {
        bookingId,
        cancelledBy: role,
        reason: booking.cancellation.reason
      });
    }

    /*
    =========================
    STOP TRACKING
    =========================
    */

    io.to(`booking:${bookingId}`).emit("tracking-ended", {
      bookingId
    });

    res.json({
      success: true,
      message: "Booking cancelled"
    });

  } catch (error) {
    next(error);
  }
};