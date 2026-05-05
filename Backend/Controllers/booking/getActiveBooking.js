import instantBookingModel from "../../models/instantBooking.js";

export const getActiveBooking = async (req, res) => {
  try {
    const userId = req.user._id;

    const booking = await instantBookingModel
      .findOne({
        userId,
        status: {
          $in: ["pending", "searching", "accepted", "arrived", "started"]
        }
      })
      .populate("buddyId", "name image")
      .sort({ createdAt: -1 });

    if (!booking) {
      return res.json({
        success: true,
        data: null
      });
    }

    res.json({
      success: true,
      data: {
        _id: booking._id,
        bookingId: booking._id,
        status: booking.status,
        category: booking.category,
        pickupLocation: booking.pickupLocation,
        buddy: booking.buddyId
      }
    });

  } catch (err) {
    console.log("❌ ACTIVE BOOKING ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};