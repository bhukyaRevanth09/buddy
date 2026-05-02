import instantBookingModel from "../models/instantBooking.js";
import buddyModel from "../models/BuddySchema.js";
import redis from "../Config/redis.js";
import { getIO } from "../services/Socket.js";
import { unlockBuddy } from "../utils/bookingLock.js"; // 👈 IMPORTANT FIX

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
    UPDATE BOOKING
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
    STOP REDIS FLOW
    =========================
    */
    await redis.del(`pending_booking:${bookingId}`);

    /*
    =========================
    FREE BUDDY + UNLOCK
    =========================
    */
    if (booking.buddy) {
      await buddyModel.findByIdAndUpdate(booking.buddy, {
        availabilityStatus: "available",
        currentBooking: null
      });

      // 🔥 IMPORTANT: release lock
      await unlockBuddy(booking.buddy.toString());
    }

    /*
    =========================
    USER NOTIFICATION
    =========================
    */
    io.to(booking.user.toString()).emit("booking_cancelled", {
      bookingId,
      cancelledBy: role,
      reason: booking.cancellation.reason
    });

    /*
    =========================
    BUDDY NOTIFICATION
    =========================
    */
    if (booking.buddy) {
      io.to(`buddy:${booking.buddy.toString()}`).emit("booking_cancelled", {
        bookingId,
        cancelledBy: role,
        reason: booking.cancellation.reason
      });
    }

    /*
    =========================
    STOP TRACKING ROOM
    =========================
    */
    io.to(`booking:${bookingId}`).emit("booking_status_update", {
      bookingId,
      status: "cancelled"
    });

    io.to(`booking:${bookingId}`).emit("tracking_ended", {
      bookingId
    });

    return res.json({
      success: true,
      message: "Booking cancelled"
    });

  } catch (error) {
    next(error);
  }
};