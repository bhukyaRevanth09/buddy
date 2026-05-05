import { getIO } from "./socket.js";

export const notifyUser = (
  targetId,
  event,
  data
) => {

  try {

    const io = getIO();

    io.to(
      targetId.toString()
    ).emit(event, data);

    console.log(
      `📤 ${event} -> USER ${targetId}`
    );

  } catch (error) {

    console.log(
      "❌ notifyUser error:",
      error.message
    );
  }
};