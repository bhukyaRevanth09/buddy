import instantBookingModel from "../../models/instantBooking.js";
import { getIO } from "../../socket/socket.js";
import { SOCKET_EVENTS } from "../../constants/backendSocketEvents.js";

export const startWorking = async (req, res) => {
  try {
    console.log("\n====================================");
    console.log("🚀 START WORK");
    console.log("====================================");

    const { bookingId } = req.body;
    const buddyId = req.userId;

    console.log("📦 BOOKING ID:", bookingId);
    console.log("🧑 BUDDY:", buddyId);

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "BookingId required",
      });
    }

    const booking = await instantBookingModel.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (!booking.buddy || booking.buddy.toString() !== buddyId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not allowed",
      });
    }

    if (booking.status !== "arrived") {
      return res.status(400).json({
        success: false,
        message: "Buddy must arrive first",
      });
    }

    booking.status = "started";
    booking.startedAt = new Date();

    await booking.save();

    console.log("✅ WORK STARTED");

    const io = getIO();
    const bookingRoom = `booking:${bookingId}`;

    io.to(booking.user.toString()).emit(SOCKET_EVENTS.WORK_STARTED, {
      bookingId,
      status: "started",
      startedAt: booking.startedAt,
    });

    io.to(buddyId.toString()).emit(SOCKET_EVENTS.WORK_STARTED, {
      bookingId,
      status: "started",
    });

    io.to(bookingRoom).emit(SOCKET_EVENTS.STATUS_UPDATE, {
      bookingId,
      status: "started",
      updatedAt: new Date(),
    });

    io.to(bookingRoom).emit(SOCKET_EVENTS.TRACKING_STARTED, {
      bookingId,
    });

    return res.status(200).json({
      success: true,
      message: "Work started successfully",
    });

  } catch (error) {
    console.log("❌ START WORK ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};