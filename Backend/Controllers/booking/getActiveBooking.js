import mongoose from "mongoose";
import instantBookingModel from "../../models/instantBooking.js";

export const getActiveBooking = async (req, res) => {
  try {
    console.log("========== ACTIVE BOOKING API HIT ==========");
    console.log(" AUTH USER ID:", req.user?._id);

    const userId = req.user._id;

    const booking = await instantBookingModel
      .findOne({
        user: new mongoose.Types.ObjectId(userId),
        status: {
          $in: ["searching", "accepted", "arrived", "started"]
        }
      })
      .populate("buddy", "name image profileImage phone")
      .sort({ createdAt: -1 });

    console.log(" ACTIVE BOOKING FOUND:", booking?._id || null);

    if (!booking) {
      return res.status(200).json({
        success: true,
        data: null
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: booking._id,
        bookingId: booking._id,
        status: booking.status,
        category: booking.category,
        serviceType: booking.serviceType,

        pickupLocation: {
          latitude: booking?.location?.coordinates?.[1],
          longitude: booking?.location?.coordinates?.[0]
        },

        address: booking?.location?.address || "Location Selected",
        buddy: booking.buddy,
        createdAt: booking.createdAt
      }
    });

  } catch (err) {
    console.log("ACTIVE BOOKING ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export const getBookingHistory = async (req, res) => {
  try {
    console.log("========== Booking HISTORY API HIT ==========");
    console.log(" AUTH USER:", req.user);
    console.log(" AUTH USER ID:", req.user?._id);

    const userId = req.user._id;

    const allBookings = await instantBookingModel.find({}).sort({ createdAt: -1 });

    console.log(" ALL BOOKINGS COUNT:", allBookings.length);
    console.log(
      " ALL BOOKINGS USER IDS:",
      allBookings.map((b) => ({
        bookingId: b._id,
        user: b.user,
        status: b.status
      }))
    );

    const userBookings = await instantBookingModel.find({
      user: new mongoose.Types.ObjectId(userId)
    });

    console.log(" USER BOOKINGS COUNT:", userBookings.length);
    console.log(" USER BOOKINGS:", userBookings);

    const bookings = await instantBookingModel
      .find({
        user: new mongoose.Types.ObjectId(userId),
        status: {
          $in: ["completed", "cancelled", "failed"]
        }
      })
      .populate("buddy", "name image profileImage phone")
      .sort({ createdAt: -1 });

    console.log(" HISTORY BOOKINGS COUNT:", bookings.length);
    console.log(" HISTORY BOOKINGS:", bookings);

    return res.json({
      success: true,
      data: bookings.map((booking) => ({
        _id: booking._id,
        bookingId: booking._id,
        status: booking.status,
        category: booking.category,
        serviceType: booking.serviceType,
        pickupLocation: {
          latitude: booking?.location?.coordinates?.[1],
          longitude: booking?.location?.coordinates?.[0]
        },
        address: booking?.location?.address,
        buddy: booking.buddy,
        createdAt: booking.createdAt,
        acceptedAt: booking.acceptedAt,
        arrivedAt: booking.arrivedAt,
        startedAt: booking.startedAt,
        completedAt: booking.completedAt,
        cancelledAt: booking.cancelledAt
      }))
    });

  } catch (err) {
    console.log(" BOOKING HISTORY ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};