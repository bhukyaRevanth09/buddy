// controllers/acceptBooking.js
import instantBookingModel from "../models/instantBooking.js";
import buddyModel from "../models/BuddySchema.js";
import redis from "../Config/redis.js";
import { getIO } from "../services/chatSocket.js";

export const acceptBooking = async (req, res) => {
  const io = getIO();
  const { bookingId } = req.body;
  const buddyId = req.user.id;

  const booking = await instantBookingModel.findById(bookingId);

  if (!booking || booking.status !== "pending") {
    return res.status(400).json({ message: "Invalid booking" });
  }

  // 🔒 LOCK
  const lock = await redis.set(
    `booking:${bookingId}:lock`,
    "locked",
    "NX",
    "EX",
    30
  );

  if (!lock) {
    return res.status(400).json({ message: "Already accepted" });
  }

  booking.status = "accepted";
  await booking.save();

  // ❌ stop retry
  await redis.del(`booking:${bookingId}`);

  await buddyModel.findByIdAndUpdate(buddyId, {
    availabilityStatus: "busy",
    currentBooking: booking._id
  });

  io.to(booking.user.toString()).emit("booking-accepted", { booking });

  res.json({ message: "Accepted" });
};