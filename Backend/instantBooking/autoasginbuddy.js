import buddyModel from "../models/BuddySchema.js";
import instantBookingModel from "../models/instantBooking.js";
import { getIO } from "../services/chatSocket.js";
import { waitForAcceptance } from "../utils/acceptServ.js";

export const autoAssignBuddy = async (req, res, next) => {
  try {
    const io = getIO();

    const { user, serviceType, price, lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Location required"
      });
    }

    // ✅ Find nearest available buddies
    const buddies = await buddyModel.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          distanceField: "distance",
          maxDistance: 5000, // 5km
          spherical: true
        }
      },
      {
        $match: {
          availabilityStatus: "available",
          verificationStatus: "accepted"
        }
      },
      { $sort: { rating: -1 } },
      { $limit: 5 } // try top 5 buddies
    ]);

    if (!buddies.length) {
      return res.status(404).json({
        success: false,
        message: "No nearby buddies available"
      });
    }

    // ✅ Create booking (not assigned yet)
    const booking = await instantBookingModel.create({
      user,
      serviceType,
      price,
      location: {
        type: "Point",
        coordinates: [lng, lat]
      },
      status: "pending"
    });

    // ✅ Try assigning one-by-one
    for (let buddy of buddies) {

      // assign buddy temporarily
      booking.buddy = buddy._id;
      await booking.save();

      // send request
      io.to(buddy._id.toString()).emit("new-booking", {
        message: "New auto booking request",
        booking
      });

      // ⏳ wait for response (10 sec)
      const accepted = await waitForAcceptance(booking._id, 100000);

      if (accepted) {
        // mark buddy busy
        await buddyModel.findByIdAndUpdate(buddy._id, {
          availabilityStatus: "busy",
          currentBooking: booking._id
        });

        return res.status(200).json({
          success: true,
          message: "Buddy assigned successfully",
          data: booking
        });
      }
    }

    // ❌ No one accepted
    booking.status = "cancelled";
    await booking.save();

    res.status(404).json({
      success: false,
      message: "No buddy accepted the request"
    });

  } catch (error) {
    next(error);
  }
};