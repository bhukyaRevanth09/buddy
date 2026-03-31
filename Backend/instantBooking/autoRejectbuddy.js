import instantBookingModel from "../models/instantBooking.js";
import buddyModel from "../models/BuddySchema.js";
import { getIO } from "../services/chatSocket.js";
import redis from "../Config/redis.js";

export const autorejectBooking = async (req, res, next) => {
  try {
    const io = getIO();
    const { bookingId, reason } = req.body;
    const buddyId = req.user.id; // 🔥 from auth

    const booking = await instantBookingModel.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Booking already processed"
      });
    }

    // 🔒 Check correct buddy
    if (booking.buddy.toString() !== buddyId) {
      return res.status(403).json({
        success: false,
        message: "Not your booking"
      });
    }

    // 🧠 Get Redis state
    const data = await redis.get(`booking:${bookingId}`);

    if (!data) {
      return res.status(400).json({
        success: false,
        message: "Booking expired or already handled"
      });
    }

    const parsed = JSON.parse(data);

    const nextIndex = parsed.buddyIndex + 1;

    // ❌ If no more buddies → CANCEL
    if (nextIndex >= parsed.buddies.length) {

      booking.status = "cancelled";
      booking.cancelReason = reason || "All buddies rejected";

      await booking.save();

      await redis.del(`booking:${bookingId}`);

      io.to(booking.user.toString()).emit("booking-cancelled", {
        message: "No buddy accepted your request",
        booking
      });

      return res.json({
        success: false,
        message: "No more buddies available"
      });
    }

    const nextBuddyId = parsed.buddies[nextIndex];

    // 🔄 UPDATE REDIS (THIS IS IMPORTANT 🔥)
    await redis.set(
      `booking:${bookingId}`,
      JSON.stringify({
        ...parsed,
        buddyIndex: nextIndex
      }),
      "EX",
      60
    );

    //  Update booking with new buddy
    booking.buddy = nextBuddyId;
    await booking.save();

    // Free current buddy
    await buddyModel.findByIdAndUpdate(buddyId, {
      availabilityStatus: "available",
      currentBooking: null
    });

    //  Send to next buddy
    io.to(nextBuddyId.toString()).emit("new-booking", {
      bookingId
    });

    console.log(" Rejected → moved to next buddy:", nextBuddyId);

    return res.json({
      success: true,
      message: "Moved to next buddy"
    });

  } catch (error) {
    next(error);
  }
};