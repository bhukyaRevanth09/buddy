import { getIO } from "./socket.js";

export const notifyUser = (userId, event, data = {}) => {

  try {

    const io = getIO();

    if (!userId) return;

    io.to(userId.toString()).emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });

    console.log(` ${event} -> USER ${userId}`);

  } catch (err) {
    console.log(" notifyUser error:", err.message);
  }
};