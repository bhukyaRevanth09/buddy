export const cancelBooking = async (req, res, next) => {
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

    if (["completed", "cancelled"].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel this booking"
      });
    }

    booking.status = "cancelled";
    await booking.save();

    // ✅ Free buddy if needed
    await buddyModel.findByIdAndUpdate(booking.buddy, {
      availabilityStatus: "available",
      currentBooking: null
    });

    io.to(booking.buddy.toString()).emit("booking-cancelled", {
      message: "Booking cancelled",
      booking
    });

    res.status(200).json({
      success: true,
      message: "Booking cancelled",
      data: booking
    });

  } catch (error) {
    next(error);
  }
};