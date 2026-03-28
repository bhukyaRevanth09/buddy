import instantBooking from "../models/instantBooking.js";
import serviceBooking from "../models/serviceBooking.js";
import postBookingSchema from "../models/postBookingSchema.js";

export const respondToInstantBooking = async (req, res, next) => {
  try {
    const { bookingId, action } = req.body; 
    const buddyId = req.user.id;

    const booking = await instantBooking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // security check
    if (booking.buddy.toString() !== buddyId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({ message: "Already responded" });
    }

    booking.status = action;
    await booking.save();

io.to(booking.user.toString()).emit("booking-update", {
  status: booking.status
});

    res.json({
      success: true,
      message: `Booking ${action}`
    });

  } catch (error) {
    next(error);
  }
};





// accpet or reject
export const respondToServiceBooking = async (req, res, next) => {
  try {
    const { bookingId, action } = req.body;
    const buddyId = req.user.id;

    const booking = await serviceBooking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.buddy.toString() !== buddyId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    booking.status = action; 
    await booking.save();

    res.json({
      success: true,
      message: `Service booking ${action}`
    });

  } catch (error) {
    next(error);
  }
};

//  start work 
export const startWork = async (req, res, next) => {
  try {
    const booking = await instantBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "accepted") {
      return res.status(400).json({ message: "Cannot start work" });
    }

    booking.status = "on-going";
    booking.startedAt = new Date();

    await booking.save();

    res.json({ message: "Work started" });

  } catch (error) {
    next(error);
  }
};



//  complete work
export const completeWork = async (req, res, next) => {
  try {
    const booking = await instantBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "on-going") {
      return res.status(400).json({ message: "Work not started yet" });
    }

    booking.status = "completed";
    booking.completedAt = new Date();

    await booking.save();

    res.json({ message: "Work completed" });

  } catch (error) {
    next(error);
  }
};



// export const placeBid = async (req, res, next) => {
//   try {
//     const { taskId, amount, message } = req.body;
//     const buddyId = req.user.id;

//     const bid = await Bid.create({
//       task: taskId,
//       buddy: buddyId,
//       amount,
//       message
//     });

//     // TODO: notify user

//     res.status(201).json({
//       success: true,
//       message: "Bid placed",
//       data: bid
//     });

//   } catch (error) {
//     next(error);
//   }
// };