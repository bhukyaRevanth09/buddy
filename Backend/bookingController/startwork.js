import instantBookingModel from "../models/instantBooking.js";

export const startWork = async (req, res) => {
  try {
    const { bookingId } = req.body;
    
    const booking = await instantBookingModel.findOneAndUpdate(
      { _id: bookingId, status: "arrived" }, 
      { status: "started", startedAt: new Date() },
      { new: true }
    );

    if (!booking) return res.status(400).json({ success: false, message: "Cannot start. Check if arrived." });

    getIO().to(booking.user.toString()).emit("work-started", { bookingId });

    res.status(200).json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};