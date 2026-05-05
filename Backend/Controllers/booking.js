import buddyModel from "../models/BuddySchema.js";
import userModel from "../models/userSchema.js";
import instantBookingModel from "../models/instantBooking.js";
import { getIO } from "../socket/socket.js";
import redis from "../Config/redis.js";
import { SOCKET_EVENTS } from "../constants/backendSocketEvents.js";
import mongoose from "mongoose";

/*
=========================================
TOGGLE ONLINE STATUS
=========================================
*/
export const toggleOnlineStatus = async (req, res) => {
  try {
    const buddyId = req.userId;
    const { status } = req.body;

    /*
    =========================
    NORMALIZE STATUS
    =========================
    */
    const isOnline =
      status === "available" || status === true;

    /*
    =========================
    UPDATE BUDDY
    =========================
    */
    const updatedBuddy =
      await buddyModel.findByIdAndUpdate(
        buddyId,
        {
          isOnline,
          availabilityStatus: isOnline
            ? "available"
            : "offline",
          lastSeenAt: new Date()
        },
        {
          new: true
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
    REDIS CACHE
    =========================
    */
    if (isOnline) {
      await redis.set(
        `status:${buddyId}`,
        "online",
        "EX",
        3600
      );
    } else {
      await redis.del(`status:${buddyId}`);
    }

    /*
    =========================
    SOCKET EVENT
    =========================
    */
    const io = getIO();

    io.emit(
      SOCKET_EVENTS.STATUS_UPDATE,
      {
        buddyId:
          updatedBuddy._id.toString(),
        isOnline:
          updatedBuddy.isOnline,
        availabilityStatus:
          updatedBuddy.availabilityStatus,
        lastSeen:
          updatedBuddy.lastSeenAt
      }
    );

    /*
    =========================
    RESPONSE
    =========================
    */
    return res.json({
      success: true,
      isOnline: updatedBuddy.isOnline,
      availabilityStatus:
        updatedBuddy.availabilityStatus
    });

  } catch (error) {
    console.log(
      "❌ TOGGLE STATUS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/*
=========================================
BUDDY DASHBOARD
=========================================
*/
export const getBuddyDashboard = async (req, res) => {
  try {
    const buddyId = req.userId;

    if (
      !mongoose.Types.ObjectId.isValid(
        buddyId
      )
    ) {
      return res.status(400).json({
        success: false,
        error: "INVALID_BUDDY_ID",
        message:
          "Buddy ID is invalid"
      });
    }

    /*
    =========================
    GET BUDDY DATA
    =========================
    */
    const buddy =
      await buddyModel
        .findById(buddyId)
        .select(
          "rating isOnline availabilityStatus earnings totalBooking"
        )
        .lean();

    if (!buddy) {
      return res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: "Buddy not found"
      });
    }

    /*
    =========================
    COMPLETED JOBS
    =========================
    */
    const completedJobs =
      await instantBookingModel.countDocuments(
        {
          buddy: buddyId,
          status: "completed"
        }
      );

    /*
    =========================
    ACTIVE BOOKING
    =========================
    */
    const activeBooking =
      await instantBookingModel
        .findOne({
          buddy: buddyId,
          status: {
            $in: [
              "accepted",
              "started",
              "arrived"
            ]
          }
        })
        .populate("user", "name phone")
        .lean();

    /*
    =========================
    OPTIONAL: EMIT DASHBOARD UPDATE
    (Useful for real-time UI)
    =========================
    */
    const io = getIO();

    io.to(buddyId.toString()).emit(
      SOCKET_EVENTS.STATUS_UPDATE,
      {
        type: "dashboard",
        completedJobs,
        isOnline: buddy.isOnline,
        availabilityStatus:
          buddy.availabilityStatus
      }
    );

    /*
    =========================
    RESPONSE
    =========================
    */
    return res.json({
      success: true,
      data: {
        completedJobs,
        rating:
          buddy.rating?.average || 0,
        isOnline: buddy.isOnline,
        availabilityStatus:
          buddy.availabilityStatus,
        earnings: buddy.earnings,
        totalBooking:
          buddy.totalBooking,
        activeBooking: activeBooking
          ? {
              bookingId:
                activeBooking._id,
              customerName:
                activeBooking.user?.name,
              status:
                activeBooking.status
            }
          : null
      }
    });

  } catch (err) {
    console.error(
      "❌ DASHBOARD_ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      error: "DASHBOARD_FAILED",
      message:
        "Internal server error"
    });
  }
};