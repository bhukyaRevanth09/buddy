import buddyModel from '../models/BuddySchema.js';
import { getIO } from '../services/Socket.js'; 
import redis from '../Config/redis.js';

export const toggleOnlineStatus = async (req, res) => {
  try {
    const buddyId = req.userId;
    const { status } = req.body;

    const updatedBuddy = await buddyModel.findByIdAndUpdate(
      buddyId,
      {
        isOnline: status,
        availabilityStatus: status ? "available" : "offline",
        updatedAt: new Date()
      },
      {
        returnDocument: "after"
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
    REDIS PRESENCE
    =========================
    */
    if (status) {
      await redis.set(`status:${buddyId}`, "online", "EX", 3600);
    } else {
      await redis.del(`status:${buddyId}`);
    }

    /*
    =========================
    SOCKET BROADCAST
    =========================
    */
    const io = getIO();

    io.emit("buddy_status_updated", {
      buddyId: updatedBuddy._id.toString(), // ✅ important
      isOnline: updatedBuddy.isOnline,
      availabilityStatus: updatedBuddy.availabilityStatus,
      lastSeen: updatedBuddy.updatedAt
    });

    /*
    =========================
    RESPONSE
    =========================
    */
    res.json({
      success: true,
      isOnline: updatedBuddy.isOnline
    });

  } catch (error) {
    console.log("toggle error", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};