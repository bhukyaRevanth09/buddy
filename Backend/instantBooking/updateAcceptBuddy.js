import instantBookingModel from "../models/instantBooking.js";
import buddyModel from "../models/BuddySchema.js";
import { getIO } from "../services/chatSocket.js";
import { publisher } from "../services/redis.js";

export const acceptBooking = async (req, res, next) => {
  try {
    const io = getIO();
    const { bookingId } = req.body;

    const booking = await instantBookingModel.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    // Prevent double actions
    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Booking already processed"
      });
    }

    // Update booking
    booking.status = "accepted";
    await booking.save();

  await publisher.publish(`booking:${booking._id}`, "accepted", "EX", 60);

    //  Update buddy
    await buddyModel.findByIdAndUpdate(booking.buddy, {
      availabilityStatus: "busy",
      currentBooking: booking._id
    });

    //  Notify user
    io.to(booking.user.toString()).emit("booking-accepted", {
      message: "Booking accepted",
      booking
    });

    res.status(200).json({
      success: true,
      message: "Booking accepted successfully",
      data: booking
    });

  } catch (error) {
    next(error);
  }
};