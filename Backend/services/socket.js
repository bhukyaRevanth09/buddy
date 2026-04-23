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
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Socket auth failed"));
      }

      const decoded = jwt.verify(token, process.env.JWT_KEY);

      socket.userId = decoded.id || decoded._id;
      socket.role = decoded.role;

      next();

    } catch (error) {
      console.log("Socket Auth Error:", error.message);
      next(new Error("Socket auth failed"));
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

      // mark online
      await redis.hset("online_buddies", userId, "online");

      /*
      =============================
      LIVE LOCATION UPDATE
      =============================
      */
      socket.on("update_location", async (data) => {

        try {
          const { lat, lng, bookingId } = data;

          // save to redis geo
          await redis.geoadd(
            "buddy_locations",
            lng,
            lat,
            userId
          );

          /*
          =====================================
          BROADCAST TO NEARBY USERS (DISCOVERY)
          =====================================
          */
          io.emit("buddy_live_location", {
            buddyId: userId,
            lat,
            lng
          });

          /*
          =====================================
          TRACK ACTIVE BOOKING
          =====================================
          */
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


      /*
      =============================
      ONLINE / OFFLINE STATUS
      =============================
      */
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
    ===================================================
    USER TRACK NEARBY BUDDIES
    ===================================================
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


    /*
    ===================================================
    TRACK BOOKING
    ===================================================
    */
    socket.on("track_booking", (bookingId) => {
      socket.join(`booking:${bookingId}`);
    });

    socket.on("join_booking_room", (bookingId) => {
      socket.join(`booking:${bookingId}`);
    });


    /*
    ===================================================
    USER WATCH BUDDY
    ===================================================
    */
    socket.on("watch_buddy", (buddyId) => {
      socket.join(`buddy:${buddyId}`);
    });


    /*
    ===================================================
    DISCONNECT
    ===================================================
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