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

    // 🔍 FIND BEST BUDDIES
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
          skills: serviceType,
          pricePerHour: { $lte: price }
        }
      },
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

    // 📝 CREATE BOOKING FIRST
    const booking = await instantBookingModel.create({
      user,
      serviceType,
      pricing: {
        totalAmount: price
      },
      location: {
        address: "",
        coordinates: {
          type: "Point",
          coordinates: [lng, lat]
        }
      },
      status: "searching",
      buddy: null // ❗ not assigned yet
    });

    // 🧠 REDIS STATE
    const redisData = {
      buddyIndex: 0,
      buddies: buddies.map(b => b._id.toString()),
      status: "searching"
    };

    await redis.set(
      `booking:${booking._id}`,
      JSON.stringify(redisData),
      "EX",
      120 // ⏳ 2 min expiry
    );

    // 📡 SEND TO FIRST BUDDY
    const firstBuddy = buddies[0];

    io.to(firstBuddy._id.toString()).emit("new-booking", {
      message: "New auto booking request",
      bookingId: booking._id
    });

    console.log("🚀 Sent to first buddy:", firstBuddy._id);

    // ⏳ QUEUE FOR RETRY SYSTEM
    await bookingQueue.add(
      "retry-booking",
      {
        bookingId: booking._id
      },
      {
        delay: 10000 // 10 sec wait
      }
    );

    return res.status(200).json({
      success: true,
      message: "Searching for best buddy...",
      bookingId: booking._id
    });

  } catch (error) {
    next(error);
  }
};