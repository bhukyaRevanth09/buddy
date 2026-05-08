import { getIO } from "./socket.js";

export const notifyBookingRoom = (bookingId, event, data = {}) => {

  try {

    const io = getIO();

    if (!bookingId) return;

    io.to(`booking_${bookingId}`).emit(event, {
      ...data,
      bookingId,
      timestamp: new Date().toISOString()
    });

    console.log(` ${event} -> booking_${bookingId}`);

  } catch (err) {
    console.log(" notifyBookingRoom error:", err.message);
  }
};