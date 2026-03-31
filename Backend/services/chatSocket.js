import { Server } from "socket.io";
import redis from "../Config/redis.js";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: "*" }
  });

  io.on("connection", (socket) => {

    console.log("User connected:", socket.id);

    socket.on("join", async ({ userId, role }) => {

      const room = `${role}:${userId}`;
      socket.join(room);

      //  mark online
      await redis.set(`online:${room}`, "true");

      console.log(`Joined room: ${room}`);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected:", socket.id);
    });

  });
};

export const getIO = () => {
  if (!io) throw new Error("Socket not initialized");
  return io;
};