import instantBookingModel from "../../models/instantBooking.js";
import buddyModel from "../../models/BuddySchema.js";
import { getIO } from "../../services/chatSocket.js";

export const autorejectBooking = async (req, res, next) => {
  try {

    const io = getIO();
    const { bookingId, reason } = req.body;

    const booking = await instantBookingModel.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success:false,
        message:"Booking not found"
      });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        success:false,
        message:"Booking already processed"
      });
    }

    booking.status = "cancelled";
    booking.cancelReason = reason || "Rejected by buddy";

    await booking.save();

    // free buddy again
    await buddyModel.findByIdAndUpdate(
      booking.buddy,
      {
        availabilityStatus:"available",
        currentBooking:null
      }
    );

    io.to(booking.user.toString()).emit(
      "booking-rejected",
      {
        message:"Booking rejected",
        booking
      }
    );

    res.status(200).json({
      success:true,
      message:"Booking rejected",
      data:booking
    });

  } catch (error) {

    next(error);

  }
};