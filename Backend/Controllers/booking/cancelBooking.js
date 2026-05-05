import instantBookingModel from "../../models/instantBooking.js";
import buddyModel from "../../models/BuddySchema.js";
import { getIO } from "../../socket/socket.js";
import { SOCKET_EVENTS } from "../../constants/backendSocketEvents.js";
import { unlockBuddy } from "../../utils/bookingLock.js";
import redis from "../../Config/redis.js";

export const cancelBooking = async (req, res, next) => {
  try {
    console.log("\n====================================");
    console.log("❌ CANCEL BOOKING");
    console.log("====================================");

    const io = getIO();

    const { bookingId, reason } = req.body;
    const userId = req.userId; // ✅ FIXED
    const role = req.userRole || req.user?.role || "user";

    console.log("📦 BOOKING ID:", bookingId);
    console.log("👤 USER:", userId);
    console.log("🎭 ROLE:", role);

    /*
    =========================
    VALIDATION
    =========================
    */

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID required",
      });
    }

    const booking = await instantBookingModel.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (["completed", "cancelled"].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: "Booking already finished",
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
      reason: reason || `Cancelled by ${role}`,
    };

    await booking.save();

    console.log("📝 BOOKING UPDATED");

    /*
    =========================
    STOP REDIS FLOW
    =========================
    */

    await redis.del(`booking:pending:${bookingId}`); // ✅ FIXED KEY

    /*
    =========================
    FREE BUDDY
    =========================
    */

    if (booking.buddy) {
      await buddyModel.findByIdAndUpdate(booking.buddy, {
        availabilityStatus: "available",
        currentBooking: null,
      });

      await unlockBuddy(booking.buddy.toString());

      console.log("🟢 BUDDY FREED");
    }

    /*
    =========================
    SOCKET ROOMS
    =========================
    */

    const bookingRoom = `booking:${bookingId}`;

    /*
    =========================
    USER NOTIFICATION
    =========================
    */

    io.to(booking.user.toString()).emit(
      SOCKET_EVENTS.BOOKING_CANCELLED,
      {
        bookingId,
        cancelledBy: role,
        reason: booking.cancellation.reason,
      }
    );

    /*
    =========================
    BUDDY NOTIFICATION
    =========================
    */

    if (booking.buddy) {
      io.to(booking.buddy.toString()).emit( // ✅ safer than buddy:<id>
        SOCKET_EVENTS.BOOKING_CANCELLED,
        {
          bookingId,
          cancelledBy: role,
          reason: booking.cancellation.reason,
        }
      );
    }

    /*
    =========================
    BOOKING ROOM EVENTS
    =========================
    */

    io.to(bookingRoom).emit(
      SOCKET_EVENTS.STATUS_UPDATE,
      {
        bookingId,
        status: "cancelled",
        updatedAt: new Date(),
      }
    );

    io.to(bookingRoom).emit(
      SOCKET_EVENTS.TRACKING_ENDED,
      {
        bookingId,
      }
    );

    /*
    =========================
    CLEAN REDIS ACTIVE STATE
    =========================
    */

    await redis.del(`booking:active:${bookingId}`);

    await redis.del(
      `user:active_booking:${booking.user}`
    );

    if (booking.buddy) {
      await redis.del(
        `buddy:active_booking:${booking.buddy}`
      );

      await redis.del(
        `booking:accept:${bookingId}`
      );
    }

    console.log("🧹 REDIS CLEANED");

    /*
    =========================
    RESPONSE
    =========================
    */

    return res.json({
      success: true,
      message: "Booking cancelled",
    });

  } catch (error) {
    console.log("❌ CANCEL ERROR:", error);
    next(error);
  }
};