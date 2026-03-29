import instantBookingModel from "../models/instantBooking.js";
import buddyModel from "../models/BuddySchema.js";
import userModel from "../models/UserSchema.js";
import { getIO } from "../services/chatSocket.js";


export const createInstantBooking = async (req, res, next) => {
  try {
    const io = getIO();

    const { buddy, user, serviceType, price, location } = req.body;

    // Check user & buddy exist
    const checkingBuddy = await buddyModel.findById(buddy);
    const checkingUser = await userModel.findById(user);

    if (!checkingBuddy || !checkingUser) {
      return res.status(404).json({
        success: false,
        message: "User or Buddy not found"
      });
    }

    // Check if buddy is busy
    const busyBooking = await instantBookingModel.findOne({
      buddy: buddy,
      status: { $in: ["pending", "accepted", "ongoing"] }
    });

    if (busyBooking) {
      return res.status(409).json({
        success: false,
        message: "Buddy is busy right now, try later"
      });
    }

    // Create booking
    const booking = await instantBookingModel.create({
      user,
      buddy,
      serviceType,
      price,
      location,
      status: "pending"
    });

    //Notify buddy in real-time
    io.to(buddy.toString()).emit("new-booking", {
      message: "New booking request",
      booking
    });

    res.status(201).json({
      success: true,
      message: "Instant booking created",
      data: booking
    });

  } catch (error) {
    next(error);
  }
};