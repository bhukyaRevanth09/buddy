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

    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Booking already processed"
      });
    }

    booking.status = "accepted";
    await booking.save();

    // store temporary state in redis
    await publisher.setEx(`booking:${booking._id}`, 60, "accepted");

    await buddyModel.findByIdAndUpdate(booking.buddy, {
      availabilityStatus: "busy",
      currentBooking: booking._id
    });

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