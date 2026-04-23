import instantBookingModel from "../models/instantBooking.js";
import buddyModel from "../models/BuddySchema.js";
import { getIO } from "../services/Socket.js";

export const completeWork = async (req, res) => {
  const { bookingId } = req.body;
  const buddyId = req.user._id;

  try {
    /*
    ========================
    COMPLETE BOOKING
    ========================
    */

    const booking = await instantBookingModel.findOneAndUpdate(
      { _id: bookingId, status: "started" },
      { 
        $set: { 
          status: "completed",
          completedAt: new Date()
        } 
      },
      { new: true }
    );

    if (!booking) {
      return res.status(400).json({
        success: false,
        message: "Invalid state"
      });
    }

    /*
    ========================
    MAKE BUDDY AVAILABLE
    ========================
    */

    await buddyModel.findByIdAndUpdate(buddyId, {
      availabilityStatus: "available"
    });

    const io = getIO();

    /*
    ========================
    NOTIFY USER
    ========================
    */

    io.to(booking.user.toString()).emit("booking-completed", {
      bookingId,
      amount: booking.pricing?.totalAmount || 0,
      completedAt: booking.completedAt
    });

    /*
    ========================
    NOTIFY BUDDY
    ========================
    */

    io.to(buddyId.toString()).emit("job-finished", {
      bookingId
    });

    /*
    ========================
    STOP TRACKING
    ========================
    */

    io.to(`booking:${bookingId}`).emit("tracking-ended", {
      bookingId
    });

    /*
    ========================
    RESPONSE
    ========================
    */

    res.status(200).json({
      success: true,
      message: "Work completed successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};