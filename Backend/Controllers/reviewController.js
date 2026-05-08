import reviewModel from "../models/ReviewSchema.js";
import buddyModel from "../models/BuddySchema.js";
import instantBookingModel from "../models/instantBooking.js";
import redis from "../Config/redis.js";

export const createReview = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { bookingId, rating, comment } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user"
      });
    }

    if (!bookingId || rating == null) {
      return res.status(400).json({
        success: false,
        message: "Booking and rating required"
      });
    }

    const numericRating = Number(rating);

    if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5"
      });
    }

    const booking = await instantBookingModel.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    if (booking.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not allowed"
      });
    }

    if (booking.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Review allowed only after completion"
      });
    }

    if (!booking.buddy) {
      return res.status(400).json({
        success: false,
        message: "Buddy not found"
      });
    }

    const alreadyReviewed = await reviewModel.exists({
      booking: bookingId,
      user: userId
    });

    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: "Review already submitted"
      });
    }

    const review = await reviewModel.create({
      booking: bookingId,
      user: userId,
      buddy: booking.buddy,
      rating: numericRating,
      comment: comment?.trim() || ""
    });

    const buddy = await buddyModel.findById(booking.buddy);

    if (buddy) {
      const oldAvg = buddy.rating?.average || 0;
      const oldCount = buddy.rating?.count || 0;
      const newCount = oldCount + 1;
      const newAvg = (oldAvg * oldCount + numericRating) / newCount;

      await buddyModel.findByIdAndUpdate(booking.buddy, {
        "rating.average": Number(newAvg.toFixed(1)),
        "rating.count": newCount
      });
    }

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      data: review
    });

  } catch (err) {
    console.log(" REVIEW ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export const getBuddyReviews = async (req, res) => {
  try {
    const { buddyId } = req.params;

    const reviews = await reviewModel
      .find({ buddy: buddyId })
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      data: reviews
    });

  } catch (err) {
    console.log(" GET BUDDY REVIEWS ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};