import instantBookingModel from "../models/instantBooking.js";
import buddyModel from "../models/BuddySchema.js";
import { getIO } from "../services/chatSocket.js";
import redis from "../Config/redis.js";

export const cancelBooking = async (req, res, next) => {
  try {
    const io = getIO();
    const { bookingId, reason } = req.body;
    const userId = req.user.id;
    const role = req.user.role;

    const booking = await instantBookingModel.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (["completed", "cancelled"].includes(booking.status)) {
      return res.status(400).json({ success: false, message: "Booking already finished" });
    }

    booking.status = "cancelled";
    booking.cancellation = {
      cancelledBy: role,
      reason: reason || `Cancelled by ${role}`
    };

    await booking.save();

    // ❌ stop auto-assign
    await redis.del(`booking:${bookingId}`);

    // 🧑‍🔧 free buddy
    if (booking.buddy) {
      await buddyModel.findByIdAndUpdate(booking.buddy, {
        availabilityStatus: "available",
        currentBooking: null
      });

      io.to(booking.buddy.toString()).emit("booking-cancelled", { bookingId });
    }

    // 👤 notify user
    io.to(booking.user.toString()).emit("booking-cancelled", { bookingId });

    return res.json({
      success: true,
      message: "Booking cancelled"
    });

  } catch (error) {
    next(error);
  }
};