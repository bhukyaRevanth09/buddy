import instantBookingModel from "../../models/instantBooking.js";

export const getBookingHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const bookings = await instantBookingModel
      .find({
        userId,
        status: {
          $in: ["completed", "cancelled"]
        }
      })
      .populate("buddyId", "name image")
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      data: bookings.map((b) => ({
        _id: b._id,
        bookingId: b._id,
        status: b.status,
        category: b.category,
        buddy: b.buddyId,
        createdAt: b.createdAt
      }))
    });

  } catch (err) {
    console.log("❌ HISTORY ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};