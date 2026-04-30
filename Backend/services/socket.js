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
  AUTH MIDDLEWARE
  =========================
  */
  io.use((socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      if (!token) return next(new Error("NO_TOKEN"));

      if (token.startsWith("Bearer ")) {
        token = token.split(" ")[1];
      }

      const decoded = jwt.verify(token, process.env.JWT_KEY);

      socket.userId = decoded.id || decoded._id;
      socket.role = decoded.role;

      console.log("✅ Socket Auth:", socket.userId, socket.role);

      next();

    } catch (err) {
      console.log("❌ Socket Auth Failed:", err.message);
      next(new Error("AUTH_FAILED"));
    }
  });

  /*
  =========================
  CONNECTION
  =========================
  */
  io.on("connection", (socket) => {
    const { userId, role } = socket;

    console.log(`🟢 Connected: ${role} → ${userId}`);

    socket.join(userId.toString());

    /*
    =========================
    JOIN BOOKING ROOM (USER + BUDDY)
    =========================
    */
    socket.on("join_booking_room", (bookingId) => {
      if (!bookingId) return;

      socket.join(`booking:${bookingId}`);
      console.log(`📦 joined booking:${bookingId}`);
    });

    /*
    =========================
    BUDDY LIVE LOCATION
    =========================
    */
    if (role === "buddy") {

      socket.on("update_location", async ({ lat, lng, bookingId }) => {
        try {
          if (!lat || !lng) return;

          // store latest location
          await redis.geoadd("buddy_locations", lng, lat, userId);

          /*
          🔥 SEND TO BOOKING USER ONLY
          */
          if (bookingId) {
            io.to(`booking:${bookingId}`).emit("location_update", {
              bookingId,
              buddyId: userId,
              lat,
              lng,
              timestamp: Date.now()
            });
          }

        } catch (err) {
          console.log("❌ Location error:", err);
        }
      });

      /*
      =========================
      ONLINE / OFFLINE STATUS
      =========================
      */
      socket.on("buddy:status", async ({ isOnline }) => {
        try {
          if (isOnline) {
            await redis.hset("online_buddies", userId, "online");
          } else {
            await redis.hdel("online_buddies", userId);
          }

          io.emit("buddy_status_updated", {
            buddyId: userId,
            isOnline
          });

        } catch (err) {
          console.log(err);
        }
      });
    }

    /*
    =========================
    USER: WATCH NEARBY BUDDIES
    =========================
    */
    socket.on("watch_nearby_buddies", async ({ lat, lng }) => {
      try {
        const buddies = await redis.georadius(
          "buddy_locations",
          lng,
          lat,
          20,
          "km",
          "WITHDIST",
          "WITHCOORD"
        );

        socket.emit("nearby_buddies", buddies);

      } catch (err) {
        console.log(err);
      }
    });

    /*
    =========================
    DISCONNECT
    =========================
    */
    socket.on("disconnect", async () => {
      console.log(`🔴 Disconnected: ${role} → ${userId}`);

      if (role === "buddy") {
        await redis.hdel("online_buddies", userId);
        await redis.zrem("buddy_locations", userId);

        io.emit("buddy_status_updated", {
          buddyId: userId,
          isOnline: false
        });
      }
    });

  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket not initialized");
  return io;
};