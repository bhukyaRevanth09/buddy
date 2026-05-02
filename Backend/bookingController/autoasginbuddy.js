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
            category
          }
        }
      },
      ...(skills.length ? [{ $match: { skills: { $in: skills } } }] : []),
      { $limit: 5 }
    ]);

    if (!buddies.length) {
      return res.json({
        success: false,
        message: "No buddies nearby"
      });
    }

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
      address: { fullAddress, houseNo, road, landmark },
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

    // USER EVENT
    io.to(req.userId.toString()).emit("booking-searching", {
      bookingId
    });

    // BUDDY EVENT
    io.to(assigned.id).emit("new-booking-request", {
      bookingId,
      customerName: req.userName || "Customer",
      categoryName: category,
      distance: (assigned.distance / 1000).toFixed(2),
      address: fullAddress,
      location: { lat: latitude, lng: longitude }
    });

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
  try {
    const { bookingId } = req.body;
    const buddyId = req.userId;

    const raw = await redis.get(`pending_booking:${bookingId}`);
    if (!raw) {
      return res.status(404).json({ success: false, message: "Expired" });
    }

    const state = JSON.parse(raw);
    await redis.del(`pending_booking:${bookingId}`);

    const booking = await instantBookingModel.create({
      user: state.user,
      buddy: buddyId,
      category: state.category,
      skills: state.skills,
      pricing: state.pricing,
      location: state.location,
      address: state.address,
      status: "accepted"
    });

    const io = getIO();
    const id = booking._id.toString();

    /*
    =========================
    USER
    =========================
    */
    io.to(state.user.toString()).emit("booking_accepted", {
      bookingId: id,
      buddy: { _id: buddyId }
    });

    /*
    =========================
    TRACKING START
    =========================
    */
    io.to(`booking:${id}`).emit("tracking_started", {
      bookingId: id
    });

    /*
    =========================
    BUDDY
    =========================
    */
    io.to(buddyId.toString()).emit("booking_confirmed", {
      bookingId: id
    });

    res.json({ success: true, data: booking });

  } catch (err) {
    res.status(500).json({ success: false });
  }
};



export const completeBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;

    await instantBookingModel.findByIdAndUpdate(bookingId, {
      status: "completed"
    });

    const io = getIO();

    io.to(`booking:${bookingId}`).emit("booking_completed", {
      bookingId
    });

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ success: false });
  }
};