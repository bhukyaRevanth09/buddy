import instantBookingModel from "../models/instantBooking";

export const completeWork = async (req, res, next) => {
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

    if (booking.status !== "ongoing") {
      return res.status(400).json({
        success: false,
        message: "Work not in progress"
      });
    }

    booking.status = "completed";
    await booking.save();

    // ✅ Free buddy
    await buddyModel.findByIdAndUpdate(booking.buddy, {
      availabilityStatus: "available",
      currentBooking: null,
      $inc: { totalBooking: 1 }
    });

    io.to(booking.user.toString()).emit("work-completed", {
      message: "Work completed",
      booking
    });

    res.status(200).json({
      success: true,
      message: "Work completed successfully",
      data: booking
    });

  } catch (error) {
    next(error);
  }
};