import { getIO } from "../../socket/socket.js";
import instantBookingModel from "../../models/instantBooking.js";
import { SOCKET_EVENTS } from "../../constants/backendSocketEvents.js";

export const arrivedBooking = async (req, res, next) => {
  try {
 
    const { bookingId } = req.body;
    const buddyId = req.userId;

    console.log(" BOOKING ID:", bookingId);
    console.log(" BUDDY ID:", buddyId);

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID required",
      });
    }

    const booking = await instantBookingModel.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    console.log(" CURRENT STATUS:", booking.status);
    console.log(" BOOKING USER:", booking.user);
    console.log(" BOOKING BUDDY:", booking.buddy);

    if (!booking.buddy || booking.buddy.toString() !== buddyId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not allowed",
      });
    }

    if (booking.status !== "accepted") {
      return res.status(400).json({
        success: false,
        message: "Invalid state. Booking must be accepted first.",
      });
    }

 
    booking.status = "arrived";
    booking.arrivedAt = new Date();

    await booking.save();

    console.log("BOOKING MARKED ARRIVED");

 
    // SOCKET EVENTS
    
    const io = getIO();
    const bookingRoom = `booking:${bookingId}`;

    // Force user + buddy sockets into booking room
    io.sockets.sockets.forEach((socket) => {
      const socketUserId = socket.userId?.toString();

      if (
        socketUserId === booking.user.toString() ||
        socketUserId === buddyId.toString()
      ) {
        socket.join(bookingRoom);
        console.log(" Socket joined room:", {
          socketId: socket.id,
          userId: socketUserId,
          room: bookingRoom,
        });
      }
    });

    console.log(" EMIT BUDDY_ARRIVED:", SOCKET_EVENTS.BUDDY_ARRIVED);
    console.log(" EMIT STATUS_UPDATE:", SOCKET_EVENTS.STATUS_UPDATE);

    // Direct user event
    io.to(booking.user.toString()).emit(SOCKET_EVENTS.BUDDY_ARRIVED, {
      bookingId,
      status: "arrived",
      arrivedAt: booking.arrivedAt,
      buddyId,
    });

    // Direct buddy event
    io.to(buddyId.toString()).emit(SOCKET_EVENTS.BUDDY_ARRIVED, {
      bookingId,
      status: "arrived",
      arrivedAt: booking.arrivedAt,
      buddyId,
    });

  
    io.to(bookingRoom).emit(SOCKET_EVENTS.STATUS_UPDATE, {
      bookingId,
      status: "arrived",
      updatedAt: new Date(),
      buddyId,
    });

    console.log(" BUDDY_ARRIVED SENT TO USER:", booking.user.toString());
    console.log(" BUDDY_ARRIVED SENT TO BUDDY:", buddyId.toString());
    console.log(" STATUS_UPDATE SENT TO ROOM:", bookingRoom);

    return res.json({
      success: true,
      message: "Buddy arrived successfully",
      data: {
        bookingId,
        status: "arrived",
        arrivedAt: booking.arrivedAt,
      },
    });
  } catch (err) {
    console.log(" ARRIVED ERROR:", err);
    next(err);
  }
};