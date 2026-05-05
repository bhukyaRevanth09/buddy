import redis from "../Config/redis.js";
import { getIO } from "../socket/socket.js";

/**
 * Clears the temporary search state from Redis.
 */
export const clearBookingState = async (bookingId) => {
    try {
        await redis.del(`booking_state:${bookingId}`);
        console.log(`[Redis] State cleared for: ${bookingId}`);
    } catch (error) {
        console.error(`[Redis Error]: ${error.message}`);
    }
};

/**
 * Sends a real-time notification to a user or buddy.
 */
export const notifyUser = (targetId, event, data) => {
    try {
        const io = getIO();
        io.to(targetId.toString()).emit(event, data);
        console.log(`[Socket] Sent ${event} to ${targetId}`);
    } catch (error) {
        console.error(`[Socket Error]: ${error.message}`);
    }
};