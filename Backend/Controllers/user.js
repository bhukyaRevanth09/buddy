
 import instantBooking from "../models/instantBooking.js";

//  instant booking
export const getMyInstantBookings = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const bookings = await instantBooking.find({ user: userId })
      .populate("buddy", "name phone");

    res.json({ success: true, data: bookings });

  } catch (error) {
    next(error);
  }
};

// instant cancel booking
export const cancelInstantBooking = async (req, res, next) => {
  try {
    const booking = await instantBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.status = "cancelled";
    await booking.save();

    res.json({ message: "Booking cancelled" });

  } catch (error) {
    next(error);
  }
};


// service booking
export const getMyServiceBookings = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const bookings = await ServiceBooking.find({ user: userId })
      .populate("buddy", "name phone");

    res.json({ success: true, data: bookings });

  } catch (error) {
    next(error);
  }
};

// service cancel booking

export const cancelServiceBooking = async (req, res, next) => {
  try {
    const booking = await ServiceBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.status = "cancelled";
    await booking.save();

    res.json({ message: "Service booking cancelled" });

  } catch (error) {
    next(error);
  }
};

// post Booking of user
export const getMyTasks = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const tasks = await PostTask.find({ user: userId });

    res.json({ success: true, data: tasks });

  } catch (error) {
    next(error);
  }
};