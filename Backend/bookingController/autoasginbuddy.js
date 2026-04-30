import mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid'; // Ensure you have 'uuid' package installed
import redis from "../Config/redis.js";
import buddyModel from "../models/BuddySchema.js";
import instantBookingModel from "../models/instantBooking.js";
import CategoryMOdel from "../models/Category.js";
import skillModel from "../models/SkillStore.js";
import interestModel from "../models/Inerest.js";
import { getIO } from "../services/Socket.js";
import { bookingQueue } from "../Config/queueConfig.js";
import { lockBuddy } from "../utils/bookingLock.js";




export const autoAssignBuddy = async (req, res) => {
  console.log(req?.body)
  try {
    const {
      category,
      skills = [],
      lat,
      lng,
      price,
      fullAddress,
      houseNo,
      road,
      landmark
    } = req.body;

    const io = getIO();

    const longitude = parseFloat(lng);
    const latitude = parseFloat(lat);

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Invalid location"
      });
    }

    /*
    =========================
    FIND BUDDIES
    =========================
    */
    const buddies = await buddyModel.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [longitude, latitude]
          },
          distanceField: "distance",
          maxDistance: 20000,
          spherical: true,
          key: "geoLocation",
          query: {
            availabilityStatus: "available",
            accountStatus: "active",
            isOnline: true,
            category: category
          }
        }
      },
      ...(skills.length
        ? [{ $match: { skills: { $in: skills } } }]
        : []),
      { $limit: 5 }
    ]);

    if (!buddies.length) {
      return res.json({
        success: false,
        message: "No buddies nearby"
      });
    }

    /*
    =========================
    CREATE STATE
    =========================
    */
    const bookingId = `temp_${Date.now()}`;

    const state = {
      id: bookingId,
      user: req.userId,
      category,
      skills,
      pricing: { totalAmount: price || 0 },

      location: {
        type: "Point",
        coordinates: [longitude, latitude]
      },

      address: {
        fullAddress,
        houseNo,
        road,
        landmark
      },

      buddies: buddies.map(b => ({
        id: b._id.toString(),
        distance: b.distance
      })),

      currentIndex: 0
    };

    await redis.set(
      `pending_booking:${bookingId}`,
      JSON.stringify(state),
      "EX",
      600
    );

    /*
    =========================
    ASSIGN FIRST
    =========================
    */
    let assigned = null;

    for (let b of state.buddies) {
      const locked = await lockBuddy(b.id);
      if (locked) {
        assigned = b;
        break;
      }
    }

    if (!assigned) {
      return res.json({
        success: false,
        message: "All buddies busy"
      });
    }

    /*
    =========================
    EMIT
    =========================
    */
    io.to(req.userId.toString()).emit("booking-searching", {
      bookingId
    });

    io.to(assigned.id).emit("new-booking-request", {
      bookingId,
      customerName: req.userName || "Customer",
      categoryName: category,
      distance: (assigned.distance / 1000).toFixed(2),
      address: fullAddress,
      location: { lat: latitude, lng: longitude }
    });

    /*
    =========================
    QUEUE
    =========================
    */
    await bookingQueue.add(
      "check-acceptance",
      { bookingId },
      { delay: 20000 }
    );

    res.json({
      success: true,
      bookingId
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false });
  }
};
// --- PART 2: BUDDY ACCEPTS THE REQUEST ---

export const acceptBooking = async (req, res) => {
  const { bookingId } = req.body;
  const buddyId = req.userId;

  const raw = await redis.get(`pending_booking:${bookingId}`);

  if (!raw) {
    return res.json({ success: false });
  }

  const state = JSON.parse(raw);

  await redis.del(`pending_booking:${bookingId}`);

  const io = getIO();

  // 1. Send acceptance (optional)
  io.to(state.user.toString()).emit("booking-accepted", {
    bookingId,
    buddy: { _id: buddyId }
  });

  // 2. IMPORTANT: start tracking event (FIXED NAME)
  io.to(state.user.toString()).emit("tracking_started", {
    bookingId,
    buddyId
  });

  res.json({ success: true });
};



export const updateLiveLocation = async (req, res) => {
  try {
    const { bookingId, lat, lng, heading, speed } = req.body;
    const buddyId = req.userId;

    if (!bookingId || !lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "bookingId, lat, lng required",
      });
    }

    const io = getIO();

    /*
    =========================
    BROADCAST LIVE LOCATION
    =========================
    */

    io.to(`booking:${bookingId}`).emit("location_update", {
      bookingId,
      buddyId,
      location: {
        latitude: lat,
        longitude: lng,
        heading: heading || 0,
        speed: speed || 0,
      },
      timestamp: Date.now(),
    });

    /*
    =========================
    OPTIONAL: SAVE LAST LOCATION
    =========================
    */

    await instantBookingModel.findByIdAndUpdate(
      bookingId,
      {
        lastLocation: {
          type: "Point",
          coordinates: [lng, lat],
          updatedAt: new Date(),
        },
      },
       { returnDocument: "after" }
    );

    res.json({
      success: true,
    });

  } catch (error) {
    console.error("live tracking error", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    // We 'populate' the buddy field to get their name and rating for the user
    const booking = await instantBookingModel.findById(bookingId)
      .populate('buddy', 'firstName lastName rating profilePicture');

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};