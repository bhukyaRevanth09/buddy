import mongoose from "mongoose";
import redis from "../../Config/redis.js";
import buddyModel from "../../models/BuddySchema.js";
import { getIO } from "../../socket/socket.js";
import { SOCKET_EVENTS } from "../../constants/backendSocketEvents.js";
import { dispatchBookingToBuddy } from "../../services/Booking/bookingDispatchService.js";

export const requestBooking = async (req, res) => {
  try {
    console.log("\n====================================");
    console.log("📍 NEW BOOKING REQUEST");
    console.log("====================================");

    const {
      category,
      skills = [],
      interests = [],
      lat,
      lng,
      fullAddress,
      houseNo,
      road,
      landmark,
    } = req.body;

    const userId = req.userId;
    const userName = req.userName || "Customer";

    console.log("👤 USER:", userId);

    /*
    ====================================
    VALIDATION
    ====================================
    */

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category required",
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        message: "Invalid location",
      });
    }

    const io = getIO();

    /*
    ====================================
    BLOCK MULTIPLE BOOKINGS
    ====================================
    */

    const existingBooking = await redis.get(
      `user:active_booking:${userId}`
    );

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: "Complete existing booking first",
      });
    }

    /*
    ====================================
    CONVERT IDS
    ====================================
    */

    const categoryId = new mongoose.Types.ObjectId(category);
    const skillIds = skills.map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    /*
    ====================================
    PIPELINE BUILDER
    ====================================
    */

    const buildPipeline = (useSkills = true) => [
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          distanceField: "distance",
          maxDistance: 10000,
          spherical: true,
          key: "geoLocation",
          query: {
            availabilityStatus: "available",
            accountStatus: "active",
            isOnline: true,
            category: categoryId,
            currentBooking: null,
          },
        },
      },

      ...(useSkills && skillIds.length
        ? [
            {
              $addFields: {
                matchedSkills: {
                  $size: {
                    $setIntersection: ["$skills", skillIds],
                  },
                },
              },
            },
            {
              $sort: {
                matchedSkills: -1,
                distance: 1,
              },
            },
          ]
        : [
            {
              $sort: { distance: 1 },
            },
          ]),

      {
        $project: {
          name: 1,
          distance: 1,
          matchedSkills: 1,
        },
      },

      { $limit: 5 },
    ];

    /*
    ====================================
    FIND BUDDIES
    ====================================
    */

    console.log("🔍 Searching buddies with skills...");

    let buddies = await buddyModel.aggregate(
      buildPipeline(true)
    );

    if (!buddies.length) {
      console.log("⚠️ No skill match → retry without skills");

      buddies = await buddyModel.aggregate(
        buildPipeline(false)
      );
    }

    console.log("✅ FOUND:", buddies.length);

    /*
    ====================================
    NO BUDDIES
    ====================================
    */

    if (!buddies.length) {
      io.to(userId.toString()).emit(
        SOCKET_EVENTS.BOOKING_FAILED,
        {
          message: "No buddies nearby",
        }
      );

      return res.json({
        success: false,
        message: "No buddies nearby",
      });
    }

    /*
    ====================================
    CREATE BOOKING STATE
    ====================================
    */

    const bookingId = `temp_${Date.now()}`;

    const state = {
      bookingId,
      user: userId,
      customerName: userName,

      category,
      skills,
      interests,

      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },

      address: {
        fullAddress,
        houseNo,
        road,
        landmark,
      },

      status: "searching",
      currentIndex: 0,
      assignedBuddy: null,

      buddies: buddies.map((b) => ({
        id: b._id.toString(),
        distance: b.distance,
      })),

      createdAt: new Date().toISOString(),
    };

    /*
    ====================================
    SAVE REDIS
    ====================================
    */

    await redis.set(
      `booking:pending:${bookingId}`,
      JSON.stringify(state),
      "EX",
      600
    );

    await redis.set(
      `user:active_booking:${userId}`,
      bookingId,
      "EX",
      600
    );

    /*
    ====================================
    SOCKET EVENTS
    ====================================
    */

    // 🔵 tell user search started
    io.to(userId.toString()).emit(
      SOCKET_EVENTS.BOOKING_SEARCHING,
      {
        bookingId,
        status: "searching",
      }
    );

    console.log("📡 SEARCHING EVENT SENT");

    /*
    ====================================
    DISPATCH FIRST BUDDY
    ====================================
    */

    console.log("🚀 Dispatching first buddy...");

    await dispatchBookingToBuddy({
      bookingId,
      state,
    });

    console.log("✅ DISPATCH DONE");

    /*
    ====================================
    RESPONSE
    ====================================
    */

    return res.json({
      success: true,
      message: "Searching for nearby buddies",
      bookingId,
    });
  } catch (err) {
    console.log("❌ ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};