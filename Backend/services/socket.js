import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import redis from "../Config/redis.js";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    transports: ["websocket"],
    pingTimeout: 30000,
    pingInterval: 10000,
    cors: { origin: "*" },
  });

  /*
  =========================
  AUTH (IMPROVED)
  =========================
  */
  io.use((socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("NO_TOKEN"));
      }

      token = token.replace("Bearer ", "").trim();

      const decoded = jwt.verify(token, process.env.JWT_KEY);

      socket.userId = decoded.id || decoded._id;
      socket.role = decoded.role;

      next();
    } catch (err) {
      console.log("❌ AUTH ERROR:", err.message);

      if (err.name === "TokenExpiredError") {
        return next(new Error("TOKEN_EXPIRED"));
      }

      return next(new Error("AUTH_FAILED"));
    }
  });

  /*
  =========================
  CONNECTION
  =========================
  */
  io.on("connection", (socket) => {
    const { userId, role } = socket;

    console.log(`🟢 ${role} connected → ${userId}`);

    socket.join(userId.toString());

    /*
    =========================
    BOOKING ROOM
    =========================
    */
    socket.on("join_booking_room", (bookingId) => {
      if (!bookingId) return;

      socket.join(`booking:${bookingId}`);
      console.log(`📦 ${userId} joined booking:${bookingId}`);
    });

    socket.on("leave_booking_room", (bookingId) => {
      socket.leave(`booking:${bookingId}`);
    });

    /*
    =========================
    LIVE LOCATION (THROTTLED)
    =========================
    */
    if (role === "buddy") {
      socket.on("update_location", async ({ lat, lng, bookingId }) => {
        try {
          if (!lat || !lng || !bookingId) return;

          const now = Date.now();

          if (socket.lastUpdate && now - socket.lastUpdate < 2000) return;
          socket.lastUpdate = now;

          await redis.geoadd("buddy_locations", lng, lat, userId);

          io.to(`booking:${bookingId}`).emit("location_update", {
            bookingId,
            buddyId: userId,
            latitude: lat,
            longitude: lng,
            timestamp: now
          });

        } catch (err) {
          console.log("❌ Location error:", err.message);
        }
      });
    }

    /*
    =========================
    DISCONNECT
    =========================
    */
    socket.on("disconnect", async () => {
      console.log(`🔴 ${role} disconnected → ${userId}`);

      if (role === "buddy") {
        await redis.hdel("online_buddies", userId);
        await redis.zrem("buddy_locations", userId);
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket not initialized");
  return io;
};