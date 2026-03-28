import serviceBooking from "../models/serviceBooking.js";
import { getIO } from "../services/chatSocket.js";

;

export const createServiceBooking = async (req, res, next) => {
  try {
    const io = getIO() 
    
    const {
      buddyId,
      serviceType,
      scheduledDate,
      duration,
      price,
      address
    } = req.body;

    const userId = req.user.id;

    const booking = await serviceBooking.create({
      user: userId,
      buddy: buddyId,
      serviceType,
      scheduledDate,
      duration,
      price,
      address
    });



// notify buddy
io.to(buddyId.toString()).emit("new-booking", {
  message: "New booking request",
  booking
});

    res.status(201).json({
      success: true,
      message: "Service booking scheduled",
      data: booking
    });

  } catch (error) {
    next(error);
  }
};