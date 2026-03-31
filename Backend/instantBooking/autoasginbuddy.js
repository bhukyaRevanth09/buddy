import buddyModel from "../models/BuddySchema.js";
import instantBookingModel from "../models/instantBooking.js";
import { getIO } from "../services/chatSocket.js";
import redis from "../Config/redis.js";
import {bookingQueue } from "../utils/queue/bookingQueue.js";
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
    
    await bookingQueue.add(
  "retry-booking",
  {
    bookingId: booking._id,
    buddies: buddies.map(b => b._id.toString()),
    index: 0
  },
  {
    delay: 10000 // ⏳ 10 sec wait for first buddy
  }
);

    // 🔥 HYBRID MATCHING
    const buddies = await buddyModel.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          distanceField: "distance",
          maxDistance: 5000,
          spherical: true
        }
      },
      {
        $match: {
          availabilityStatus: "available",
          verificationStatus: "accepted",
          skills: serviceType,                // ✅ skill match
          pricePerHour: { $lte: price }       // ✅ budget match
        }
      },

      // 🧠 scoring
      {
        $addFields: {
          score: {
            $add: [
              { $multiply: [5, "$rating"] },
              { $multiply: [2, "$experience"] },
              { $multiply: [-0.002, "$distance"] },
              { $multiply: [-1, "$pricePerHour"] }
            ]
          }
        }
      },

      { $sort: { score: -1 } },
      { $limit: 5 }
    ]);

    if (!buddies.length) {
      return res.status(404).json({
        success: false,
        message: "No suitable buddies found"
      });
    }

    // 📝 Create booking
    const booking = await instantBookingModel.create({
      user,
      serviceType,
      price,
      location: {
        type: "Point",
        coordinates: [lng, lat]
      },
      status: "pending",
      buddy: buddies[0]._id // ✅ assign first buddy initially
    });

    // 🧠 Redis state
    const redisData = {
      buddyIndex: 0,
      buddies: buddies.map(b => b._id.toString()),
      status: "pending"
    };

    try {
      await redis.set(
        `booking:${booking._id}`,
        JSON.stringify(redisData),
        "EX",
        60
      );
    } catch (err) {
      console.log("⚠️ Redis failed:", err.message);
    }

    // 📡 send to first buddy
    io.to(buddies[0]._id.toString()).emit("new-booking", {
      message: "New auto booking request",
      bookingId: booking._id
    });

    console.log("🚀 Booking sent to:", buddies[0]._id);

    return res.status(200).json({
      success: true,
      message: "Finding best buddy...",
      bookingId: booking._id
    });

  } catch (error) {
    next(error);
  }
};