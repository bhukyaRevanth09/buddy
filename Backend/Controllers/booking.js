import buddyModel from "../models/BuddySchema.js";
import userModel from "../models/userSchema.js";
import instantBookingModel from "../models/instantBooking.js";
import { getIO } from '../services/Socket.js'; 
import redis from '../Config/redis.js';
import mongoose from "mongoose";

export const toggleOnlineStatus = async (req, res) => {
  console.log(req.body);

  try {
    const buddyId = req.userId;
    const { status } = req.body;

    /*
    =========================
    CONVERT STATUS PROPERLY
    =========================
    */
    const isOnline = status === "available" || status === true;

   const updatedBuddy = await buddyModel.findByIdAndUpdate(
  buddyId,
  {
    isOnline: isOnline,
    availabilityStatus: isOnline ? "available" : "offline",
    updatedAt: new Date()
  },
  {
    returnDocument: "after" // ✅ correct modern replacement
  }
);

    if (!updatedBuddy) {
      return res.status(404).json({
        success: false,
        message: "Buddy not found"
      });
    }

    /*
    =========================
    REDIS
    =========================
    */
    if (isOnline) {
      await redis.set(`status:${buddyId}`, "online", "EX", 3600);
    } else {
      await redis.del(`status:${buddyId}`);
    }

    /*
    =========================
    SOCKET
    =========================
    */
    const io = getIO();

    io.emit("buddy_status_updated", {
      buddyId: updatedBuddy._id.toString(),
      isOnline: updatedBuddy.isOnline,
      availabilityStatus: updatedBuddy.availabilityStatus,
      lastSeen: updatedBuddy.updatedAt
    });

    /*
    =========================
    RESPONSE
    =========================
    */
    return res.json({
      success: true,
      isOnline: updatedBuddy.isOnline
    });

  } catch (error) {
    console.log("toggle error", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};



export const getBuddyDashboard = async (req, res) => {
  try {
    const buddyId = req.userId;

    console.log("revanth !!!");

    // Validate ID
    if (!buddyId || !mongoose.Types.ObjectId.isValid(buddyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid buddy ID"
      });
    }

    /*
    =========================
    BUDDY INFO
    =========================
    */
    const buddy = await buddyModel
      .findById(buddyId)
      .select("rating isOnline availabilityStatus")
      .lean();

    if (!buddy) {
      return res.status(404).json({
        success: false,
        message: "Buddy not found"
      });
    }

    /*
    =========================
    COMPLETED JOBS
    =========================
    */
    const completedJobs = await instantBookingModel.countDocuments({
      buddy: buddyId,
      status: "completed"
    });

    /*
    =========================
    ACTIVE BOOKING
    =========================
    */
    const booking = await instantBookingModel
      .findOne({
        buddy: buddyId,
        status: { $in: ["accepted", "started", "arrived"] }
      })
      .populate("user", "name")   // ✅ FIXED: lowercase "user"
      .lean();

    /*
    =========================
    RESPONSE
    =========================
    */
    return res.json({
      success: true,
      data: {
        completedJobs,
        rating: buddy.rating || 4.5,
        isOnline: buddy.isOnline || false,
        availabilityStatus: buddy.availabilityStatus || "offline",

        activeBooking: booking
          ? {
              bookingId: booking._id,
              customerName: booking.user?.name || "Customer",
              status: booking.status
            }
          : null
      }
    });

  } catch (error) {
    console.error("❌ Dashboard Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};