import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*"
    }
  });

  io.on("connection", (socket) => {

    console.log("User connected:", socket.id);

    // ✅ Join personal room
    socket.on("join", ({ userId, role }) => {

      if (role === "user") {
        socket.join(`user:${userId}`);
      }

      if (role === "buddy") {
        socket.join(`buddy:${userId}`);
      }

      console.log(`Joined room: ${role}:${userId}`);
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