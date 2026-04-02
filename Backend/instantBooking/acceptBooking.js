// controllers/acceptBooking.js
import instantBookingModel from "../models/instantBooking.js";
import buddyModel from "../models/BuddySchema.js";
import redis from "../Config/redis.js";
import { getIO } from "../services/chatSocket.js";

export const acceptBooking = async (req, res) => {
  const session = await instantBookingModel.startSession();
  session.startTransaction();

  try {
    const io = getIO();
    const { bookingId } = req.body;
    const buddyId = req.user.id;

    // ✅ Role check
    if (req.user.role !== "buddy") {
      return res.status(403).json({ message: "Only buddy can accept" });
    }

    // 🔒 REDIS LOCK
    const lock = await redis.set(
      `booking:${bookingId}:lock`,
      buddyId,
      "NX",
      "EX",
      30
    );

    if (!lock) {
      return res.status(400).json({ message: "Already accepted" });
    }

    // 📦 Redis data
    const redisData = await redis.get(`booking:${bookingId}`);
    if (!redisData) {
      return res.status(400).json({ message: "Booking expired" });
    }

    const parsed = JSON.parse(redisData);

    if (!parsed.buddies.includes(buddyId)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    // 🧑‍🔧 STEP 1: LOCK BUDDY FIRST
    const buddy = await buddyModel.findOneAndUpdate(
      {
        _id: buddyId,
        availabilityStatus: "available"
      },
      {
        $set: {
          availabilityStatus: "busy",
          currentBooking: bookingId
        }
      },
      { new: true, session }
    );

    if (!buddy) {
      throw new Error("Buddy already busy");
    }

    // 📦 STEP 2: LOCK BOOKING
    const booking = await instantBookingModel.findOneAndUpdate(
      {
        _id: bookingId,
        status: "searching"
      },
      {
        $set: {
          status: "accepted",
          buddy: buddyId,
          acceptedAt: new Date()
        }
      },
      { new: true, session }
    );

    if (!booking) {
      throw new Error("Booking already accepted");

    }

    // ✅ commit transaction
    await session.commitTransaction();
    session.endSession();

    // ❌ Stop retry AFTER success
    await redis.del(`booking:${bookingId}`);

    // 🔄 update redis
    parsed.status = "accepted";
    await redis.set(`booking:${bookingId}`, JSON.stringify(parsed), "EX", 60);

    // 📡 notify user
    io.to(booking.user.toString()).emit("booking-accepted", {
      bookingId,
      buddyId
    });

    // 📡 notify others
    parsed.buddies.forEach((b) => {
      if (b !== buddyId) {
        io.to(b).emit("booking-cancelled", { bookingId });
      }
    });

    return res.json({
      success: true,
      message: "Booking accepted",
      booking
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error(error);
    return res.status(500).json({
      message: error.message || "Server error"
    });
  }
};