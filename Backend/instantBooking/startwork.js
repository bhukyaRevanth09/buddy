import instantBookingModel from "../models/instantBooking.js";

export const startWork = async (req, res, next) => {
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

    if (booking.status !== "accepted") {
      return res.status(400).json({
        success: false,
        message: "Work cannot be started"
      });
    }

    booking.status = "ongoing";
    await booking.save();

    io.to(booking.user.toString()).emit("work-started", {
      message: "Work started",
      booking
    });

    res.status(200).json({
      success: true,
      message: "Work started successfully",
      data: booking
    });

  } catch (error) {
    next(error);
  }
};