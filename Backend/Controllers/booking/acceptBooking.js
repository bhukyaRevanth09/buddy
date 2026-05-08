import mongoose from "mongoose";
import redis from "../../Config/redis.js";
import buddyModel from "../../models/BuddySchema.js";
import instantBookingModel from "../../models/instantBooking.js";
import { getIO } from "../../socket/socket.js";
import { SOCKET_EVENTS } from "../../constants/backendSocketEvents.js";

export const acceptBooking = async (req, res) => {
  let session = null;

  try {

    const { bookingId } = req.body;
    const buddyId = req.userId;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID required",
      });
    }

    const io = getIO();

 
    const buddy = await buddyModel.findById(buddyId);

    if (!buddy) {
      return res.status(404).json({
        success: false,
        message: "Buddy not found",
      });
    }


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

  

    session = await mongoose.startSession();
    session.startTransaction();

  
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

  

    await redis.del(`booking:pending:${bookingId}`);



    const bookingRoom = `booking:${booking._id}`;


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


    io.to(bookingRoom).emit(
      SOCKET_EVENTS.BOOKING_CONFIRMED,
      {
        bookingId: booking._id.toString(),
        buddyId,
        userId: state.user,
      }
    );

    console.log(" SOCKET EVENTS SENT");

  
    return res.json({
      success: true,
      message: "Booking accepted successfully",
      bookingId: booking._id.toString(),
    });
  } catch (err) {
     console.log(" ACCEPT BOOKING ERROR:", err);

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
    console.log(" ACCEPT CLEANUP ERROR:", cleanupErr);
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error"
  });
  }
};