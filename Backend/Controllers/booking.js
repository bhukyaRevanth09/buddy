import buddyModel from "../models/BuddySchema.js";
import instantBookingModel from "../models/instantBooking.js";
import { getIO } from '../services/Socket.js'; 
import redis from '../Config/redis.js';

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

    /*
    =========================
    FIND BUDDY
    =========================
    */
    const buddy = await buddyModel.findById(buddyId).select(
      "name image rating isOnline availabilityStatus earnings"
    );

    if (!buddy) {
      return res.status(404).json({
        success: false,
        message: "Buddy not found"
      });
    }

    /*
    =========================
    ACTIVE BOOKING (IF ANY)
    =========================
    */
    const activeBooking = await instantBookingModel.findOne({
      buddy: buddyId,
      status: { $in: ["accepted", "started"] }
    }).populate("customer", "name phone")
      .populate("category", "name");

    /*
    =========================
    COMPLETED JOBS COUNT
    =========================
    */
    const completedJobs = await instantBookingModel.countDocuments({
      buddy: buddyId,
      status: "completed"
    });

    /*
    =========================
    TODAY EARNINGS
    =========================
    */
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayBookings = await instantBookingModel.find({
      buddy: buddyId,
      status: "completed",
      updatedAt: { $gte: today }
    });

    const todayEarnings = todayBookings.reduce(
      (sum, b) => sum + (b.price || 0),
      0
    );

    /*
    =========================
    RESPONSE
    =========================
    */
    return res.json({
      success: true,
      data: {
        buddy: {
          _id: buddy._id,
          name: buddy.name,
          image: buddy.image,
          rating: buddy.rating,
          isOnline: buddy.isOnline,
          availabilityStatus: buddy.availabilityStatus,
          earnings: buddy.earnings
        },

        stats: {
          completedJobs,
          todayEarnings
        },

        activeBooking: activeBooking || null
      }
    });

  } catch (error) {
    console.log("Dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};