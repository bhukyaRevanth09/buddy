import mongoose from "mongoose";

import redis from "../../Config/redis.js";

import buddyModel from "../../models/BuddySchema.js";

import { getIO } from "../../socket/socket.js";

import { SOCKET_EVENTS } from "../../constants/backendSocketEvents.js";

import { dispatchBookingToBuddy } from "../../services/Booking/bookingDispatchService.js";

export const requestBooking = async (req, res) => {

  try {

 
    const {
      category,
      skills = [],
      interests = [],
      lat,
      lng,
      price,
      fullAddress,
      houseNo,
      road,
      landmark
    } = req.body;

    console.log(" USER:", req.userId);

    console.log(" BODY:", req.body);

 

    if (!category) {

      console.log("CATEGORY MISSING");

      return res.status(400).json({
        success: false,
        message: "Category required"
      });
    }

    const latitude = parseFloat(lat);

    const longitude = parseFloat(lng);

    if (
      isNaN(latitude) ||
      isNaN(longitude)
    ) {

      console.log(" INVALID LOCATION");

      return res.status(400).json({
        success: false,
        message: "Invalid location"
      });
    }

    const io = getIO();

 

    const existingBooking = await redis.get(
      `user:active_booking:${req.userId}`
    );

    if (existingBooking) {

      console.log(
        " USER ALREADY HAS ACTIVE BOOKING"
      );

      return res.status(400).json({
        success: false,
        message:
          "Complete existing booking first"
      });
    }

  

    const categoryId =
      new mongoose.Types.ObjectId(category);

    const skillIds = skills.map(
      (id) =>
        new mongoose.Types.ObjectId(id)
    );

    console.log(" SKILL IDS:", skillIds);


    console.log(" SEARCHING NEARBY BUDDIES...");

    const buddies = await buddyModel.aggregate([

      {
        $geoNear: {

          near: {
            type: "Point",
            coordinates: [
              longitude,
              latitude
            ]
          },

          distanceField: "distance",

          maxDistance: 20000,

          spherical: true,

          key: "geoLocation",

          query: {

            availabilityStatus:
              "available",

            accountStatus: "active",

            isOnline: true,

            category: categoryId
          }
        }
      },

      ...(skillIds.length
        ? [
            {
              $match: {
                skills: {
                  $in: skillIds
                }
              }
            }
          ]
        : []),

      {
        $project: {
          name: 1,
          category: 1,
          skills: 1,
          distance: 1,
          isOnline: 1,
          availabilityStatus: 1
        }
      },

      {
        $limit: 5
      }

    ]);

    console.log(
      " FOUND BUDDIES:",
      buddies.length
    );

    console.log(
      JSON.stringify(buddies, null, 2)
    );

 

    if (!buddies.length) {

      console.log(" NO BUDDIES FOUND");

      io.to(
        req.userId.toString()
      ).emit(
        SOCKET_EVENTS.BOOKING_FAILED,
        {
          message:
            "No buddies nearby"
        }
      );

      return res.json({
        success: false,
        message:
          "No buddies nearby"
      });
    }

   
    const bookingId =
      `temp_${Date.now()}`;

 

    const state = {

      bookingId,

      user: req.userId,

      customerName:
        req.userName || "Customer",

      category,

      skills,

      interests,

      pricing: {
        totalAmount: price || 0
      },

      location: {

        type: "Point",

        coordinates: [
          longitude,
          latitude
        ]
      },

      address: {

        fullAddress,

        houseNo,

        road,

        landmark
      },

      status: "searching",

      currentIndex: 0,

      assignedBuddy: null,

      buddies: buddies.map(
        (buddy) => ({

          id: buddy._id.toString(),

          distance: buddy.distance
        })
      ),

      createdAt:
        new Date().toISOString()
    };

    console.log(
      "PENDING STATE CREATED"
    );

 

    await redis.set(
      `booking:pending:${bookingId}`,
      JSON.stringify(state),
      "EX",
      600
    );

    console.log(
      " SAVED TO REDIS:",
      bookingId
    );



    await redis.set(
      `user:active_booking:${req.userId}`,
      bookingId,
      "EX",
      600
    );

   
    io.to(
      req.userId.toString()
    ).emit(
      SOCKET_EVENTS.BOOKING_NEW,
      {
        bookingId,
        status: "searching"
      }
    );

    console.log(
      " SEARCHING EVENT EMITTED"
    );

  
    console.log(
      " DISPATCHING TO FIRST BUDDY..."
    );

    await dispatchBookingToBuddy({
      bookingId,
      state
    });

    console.log(
      "BOOKING DISPATCHED"
    );

 

    return res.json({

      success: true,

      message:
        "Searching for nearby buddies",

      bookingId
    });

  } catch (err) {



    console.log(
      " REQUEST BOOKING ERROR"
    );

    console.log(err);

    console.log(
      err?.message
    );

    console.log(
      err?.stack
    );


    return res.status(500).json({

      success: false,

      message:
        "Internal server error"
    });
  }
};