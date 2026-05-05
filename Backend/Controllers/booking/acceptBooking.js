import mongoose from "mongoose";
import redis from "../../Config/redis.js";
import buddyModel from "../../models/BuddySchema.js";
import instantBookingModel from "../../models/instantBooking.js";
import { getIO } from "../../socket/socket.js";
import { SOCKET_EVENTS } from "../../constants/backendSocketEvents.js";

export const acceptBooking = async (req, res) => {
  let session = null;

  try {
    console.log("\n====================================");
    console.log("✅ ACCEPT BOOKING REQUEST");
    console.log("====================================");

    const { bookingId } = req.body;
    const buddyId = req.userId;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID required",
      });
    }

    const io = getIO();

    /*
    ====================================
    CHECK BUDDY
    ====================================
    */

    const buddy = await buddyModel.findById(buddyId);

    if (!buddy) {
      return res.status(404).json({
        success: false,
        message: "Buddy not found",
      });
    }

    /*
    ====================================
    PREVENT DOUBLE ACCEPT
    ====================================
    */

    const accepted = await redis.set(
      `booking:accept:${bookingId}`,
      buddyId,
      "NX",
      "EX",
      30
    );

    if (!accepted) {
      return res.status(409).json({
        success: false,
        message: "Booking already accepted",
      });
    }

    /*
    ====================================
    GET PENDING
    ====================================
    */

    const raw = await redis.get(
      `booking:pending:${bookingId}`
    );

    if (!raw) {
      await redis.del(`booking:accept:${bookingId}`);

      return res.status(404).json({
        success: false,
        message: "Booking expired",
      });
    }

    const state = JSON.parse(raw);

    /*
    ====================================
    START TRANSACTION
    ====================================
    */

    session = await mongoose.startSession();
    session.startTransaction();

    /*
    ====================================
    CREATE BOOKING
    ====================================
    */

    const [booking] = await instantBookingModel.create(
      [
        {
          user: state.user,
          buddy: buddyId,
          category: state.category,
          skills: state.skills,
          location: state.location,
          address: state.address,
          status: "accepted",
          acceptedAt: new Date(),
        },
      ],
      { session }
    );

    /*
    ====================================
    UPDATE BUDDY
    ====================================
    */

    const updatedBuddy =
      await buddyModel.findOneAndUpdate(
        {
          _id: buddyId,
          availabilityStatus: "available",
        },
        {
          availabilityStatus: "busy",
          currentBooking: booking._id,
          lastSeenAt: new Date(),
          isOnline: true,
        },
        { new: true, session }
      );

    if (!updatedBuddy) {
      await session.abortTransaction();
      await redis.del(`booking:accept:${bookingId}`);

      return res.status(400).json({
        success: false,
        message: "Buddy already busy",
      });
    }

    await session.commitTransaction();
    session.endSession();

    /*
    ====================================
    REDIS ACTIVE STATE
    ====================================
    */

    await redis.set(
      `booking:active:${booking._id}`,
      JSON.stringify({
        bookingId: booking._id.toString(),
        user: state.user,
        buddy: buddyId,
        status: "accepted",
      }),
      "EX",
      86400
    );

    await redis.set(
      `user:active_booking:${state.user}`,
      booking._id.toString(),
      "EX",
      86400
    );

    await redis.set(
      `buddy:active_booking:${buddyId}`,
      booking._id.toString(),
      "EX",
      86400
    );

    /*
    ====================================
    CLEANUP
    ====================================
    */

    await redis.del(`booking:pending:${bookingId}`);

    /*
    ====================================
    SOCKET EVENTS
    ====================================
    */

    const bookingRoom = `booking:${booking._id}`;

    // 🔵 Join rooms
    io.sockets.sockets.forEach((socket) => {
      if (
        socket.userId?.toString() ===
          state.user.toString() ||
        socket.userId?.toString() ===
          buddyId.toString()
      ) {
        socket.join(bookingRoom);
      }
    });

    /*
    ====================================
    USER EVENT
    ====================================
    */

    io.to(state.user.toString()).emit(
      SOCKET_EVENTS.BOOKING_ACCEPTED,
      {
        bookingId: booking._id.toString(),
        buddy: {
          _id: updatedBuddy._id,
          name: updatedBuddy.name,
          phone: updatedBuddy.phone,
          rating:
            updatedBuddy.rating?.average || 0,
        },
        status: "accepted",
      }
    );

    /*
    ====================================
    CANCEL FOR OTHER BUDDIES
    ====================================
    */

    if (state.buddies?.length) {
      state.buddies.forEach((b) => {
        if (b.id !== buddyId.toString()) {
          io.to(b.id).emit(
            SOCKET_EVENTS.BOOKING_CANCELLED,
            {
              bookingId,
              message:
                "Booking taken by another buddy",
            }
          );
        }
      });
    }

    /*
    ====================================
    BOOKING ROOM EVENT
    ====================================
    */

    io.to(bookingRoom).emit(
      SOCKET_EVENTS.BOOKING_CONFIRMED,
      {
        bookingId: booking._id.toString(),
        buddyId,
        userId: state.user,
      }
    );

    console.log("📡 SOCKET EVENTS SENT");

    /*
    ====================================
    RESPONSE
    ====================================
    */

    return res.json({
      success: true,
      message: "Booking accepted successfully",
      bookingId: booking._id.toString(),
    });
  } catch (err) {
     console.log("❌ ACCEPT BOOKING ERROR:", err);

  try {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
  } catch {}

  try {
    const { bookingId } = req.body;
    const buddyId = req.userId;

    if (bookingId) {
      await redis.del(`booking:accept:${bookingId}`);
    }

    if (buddyId) {
      await redis.del(`buddy:active_booking:${buddyId}`);

      await buddyModel.findByIdAndUpdate(buddyId, {
        availabilityStatus: "available",
        currentBooking: null
      });
    }
  } catch (cleanupErr) {
    console.log("❌ ACCEPT CLEANUP ERROR:", cleanupErr);
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error"
  });
  }
};