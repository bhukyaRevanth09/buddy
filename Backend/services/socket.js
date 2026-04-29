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
  ================= AUTH
  =================
  */
  io.use((socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      if (!token) {
        console.log("❌ No socket token");
        return next(new Error("NO_TOKEN"));
      }

      // remove Bearer
      if (typeof token === "string" && token.startsWith("Bearer ")) {
        token = token.split(" ")[1];
      }

      // if JSON accidentally sent
      if (typeof token === "object" && token.accessToken) {
        token = token.accessToken;
      }

      const decoded = jwt.verify(token, process.env.JWT_KEY);

      socket.userId = decoded.id || decoded._id;
      socket.role = decoded.role;

      console.log("✅ Socket Auth Success:", socket.userId, socket.role);

      next();

    } catch (error) {

      if (error.name === "TokenExpiredError") {
        console.log("❌ Socket Token Expired");
        return next(new Error("TOKEN_EXPIRED"));
      }

      console.log("❌ Socket Auth Error:", error.message);
      next(new Error("AUTH_FAILED"));
    }
  });

  /*
  ================= CONNECTION
  =================
  */
  io.on("connection", async (socket) => {

    const { userId, role } = socket;

    console.log(`🟢 ${role} connected:`, userId);

    socket.join(userId.toString());

    /*
    ===================================================
    BUDDY EVENTS
    ===================================================
    */
    if (role === "buddy") {

      await redis.hset("online_buddies", userId, "online");

      socket.on("update_location", async (data) => {
        try {
          const { lat, lng, bookingId } = data;

          await redis.geoadd("buddy_locations", lng, lat, userId);

          io.emit("buddy_live_location", {
            buddyId: userId,
            lat,
            lng
          });

          if (bookingId) {
            io.to(`booking:${bookingId}`).emit(
              "booking_location_update",
              {
                buddyId: userId,
                lat,
                lng,
                timestamp: Date.now()
              }
            );
          }

        } catch (err) {
          console.log("Location error:", err);
        }
      });

      socket.on("buddy:status", async (data) => {
        const { isOnline } = data;

        if (isOnline) {
          await redis.hset("online_buddies", userId, "online");
        } else {
          await redis.hdel("online_buddies", userId);
        }

        io.emit("buddy_status_updated", {
          buddyId: userId,
          isOnline
        });
      });
    }

    /*
    USER TRACK NEARBY
    */
    socket.on("watch_nearby_buddies", async (data) => {
      try {
        const { lat, lng } = data;

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

    socket.on("track_booking", (bookingId) => {
      socket.join(`booking:${bookingId}`);
    });

    socket.on("join_booking_room", (bookingId) => {
      socket.join(`booking:${bookingId}`);
    });

    socket.on("watch_buddy", (buddyId) => {
      socket.join(`buddy:${buddyId}`);
    });

    /*
    DISCONNECT
    */
    socket.on("disconnect", async () => {

      console.log(`🔴 ${role} disconnected:`, userId);

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