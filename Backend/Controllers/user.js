

 import CategoryMOdel from "../models/Category.js";
import skillModel from "../models/SkillStore.js";
 import interestModel from "../models/Inerest.js";
import buddyModel from "../models/BuddySchema.js";
import mongoose from 'mongoose';
import redis from "../Config/redis.js";
import { getIO } from "../services/Socket.js";


//  instant booking
export const getMyInstantBookings = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const bookings = await instantBooking.find({ user: userId })
      .populate("buddy", "name phone");

    res.json({ success: true, data: bookings });

  } catch (error) {
    next(error);
  }
};

// instant cancel booking
export const cancelInstantBooking = async (req, res, next) => {
  try {
    const booking = await instantBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.status = "cancelled";
    await booking.save();

    res.json({ message: "Booking cancelled" });

  } catch (error) {
    next(error);
  }
};




export const getCategories = async (req, res) => {
  console.log('category')
  try {
    const categories = await CategoryMOdel.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: categories
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getSkills = async (req, res) => {
  console.log("skill")
  try {
    const { categoryId } = req.params;

    const skills = await skillModel.find({ category: categoryId });

    res.status(200).json({
      success: true,
      data: skills
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getInterests = async (req, res) => {
  try {
    const interests = await interestModel.find();

    res.status(200).json({
      success: true,
      data: interests
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


export const getNearestBuddies = async (req, res) => {
  try {
    const { latitude, longitude, categoryId, skillIds, interestIds } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Location coordinates are required."
      });
    }

    const skillArray = skillIds ? skillIds.split(",") : [];
    const interestArray = interestIds ? interestIds.split(",") : [];

    /*
    ===============================
    QUERY
    ===============================
    */
    let query = {
      accountStatus: "active",
      isOnline: true,
      availabilityStatus: "available", // ✅ IMPORTANT
      geoLocation: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [
              parseFloat(longitude),
              parseFloat(latitude)
            ]
          },
          $maxDistance: 20000
        }
      }
    };

    if (categoryId) query.category = categoryId;

    if (skillArray.length > 0) {
      query.skills = { $in: skillArray };
    }

    if (interestArray.length > 0) {
      query.interests = { $in: interestArray };
    }

    /*
    ===============================
    FIND
    ===============================
    */
    const buddies = await buddyModel
      .find(query)
      .select("-password")
      .lean();

    /*
    ===============================
    MAP FOR FRONTEND
    ===============================
    */
    const mappedBuddies = buddies.map(buddy => ({
      ...buddy,
      location: buddy.geoLocation
    }));

    res.status(200).json({
      success: true,
      count: mappedBuddies.length,
      data: mappedBuddies
    });

  } catch (error) {
    console.error("getNearestBuddies error:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};




