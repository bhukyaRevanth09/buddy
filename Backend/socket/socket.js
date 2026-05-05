import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import redis from "../Config/redis.js";
import buddyModel from "../models/BuddySchema.js";
import { SOCKET_EVENTS } from "../constants/backendSocketEvents.js";

let io;

export const initSocket = (server) => {

  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    transports: ["websocket", "polling"],
    pingTimeout: 60000,
    pingInterval: 25000
  });

  /*
  ==========================================
  SOCKET AUTH
  ==========================================
  */

  io.use(async (socket, next) => {
    try {
      console.log("\n====================================");
      console.log("🔐 SOCKET AUTH");

      const token = socket.handshake.auth?.token;

      if (!token) {
        console.log("❌ TOKEN MISSING");
        return next(new Error("Unauthorized"));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_KEY
      );

      socket.userId = decoded.id;
      socket.role = decoded.role;
      socket.user = decoded;

      console.log("✅ TOKEN VERIFIED:", socket.userId);

      next();

    } catch (err) {
      console.log("❌ SOCKET AUTH ERROR", err);
      next(new Error("Unauthorized"));
    }
  });

  /*
  ==========================================
  CONNECTION
  ==========================================
  */

  io.on("connection", async (socket) => {

    console.log("\n====================================");
    console.log("🟢 SOCKET CONNECTED");
    console.log("🧩 SOCKET ID:", socket.id);
    console.log("👤 USER:", socket.userId);

    try {

      /*
      ====================================
      PERSONAL ROOM
      ====================================
      */

      socket.join(socket.userId.toString());

      console.log("🏠 JOINED ROOM:", socket.userId);

      /*
      ====================================
      STORE SOCKET
      ====================================
      */

      await redis.set(
        `socket:${socket.userId}`,
        socket.id,
        "EX",
        86400
      );

      /*
      ====================================
      BUDDY ONLINE
      ====================================
      */

      if (socket.role === "buddy") {

        await buddyModel.findByIdAndUpdate(
          socket.userId,
          {
            isOnline: true,
            socketId: socket.id,
            lastSeenAt: new Date(),
            availabilityStatus: "available"
          }
        );

        console.log("🟢 BUDDY ONLINE");

        /*
        🔥 BROADCAST STATUS
        */

        io.emit(
          SOCKET_EVENTS.STATUS_UPDATE,
          {
            type: "buddy_presence",
            buddyId: socket.userId,
            isOnline: true,
            availabilityStatus: "available"
          }
        );
      }

      /*
      ====================================
      READY EVENT
      ====================================
      */

      socket.emit(
        SOCKET_EVENTS.CONNECTION_READY,
        {
          connected: true,
          socketId: socket.id
        }
      );

      /*
      ====================================
      JOIN BOOKING ROOM (OPTIONAL)
      ====================================
      */

      socket.on(SOCKET_EVENTS.BOOKING_JOIN, ({ bookingId }) => {
        const room = `booking:${bookingId}`;
        socket.join(room);

        console.log("📥 JOINED BOOKING:", room);
      });

      socket.on(SOCKET_EVENTS.BOOKING_LEAVE, ({ bookingId }) => {
        const room = `booking:${bookingId}`;
        socket.leave(room);

        console.log("📤 LEFT BOOKING:", room);
      });


      //  location update 

socket.on(SOCKET_EVENTS.LOCATION_UPDATE_SEND, async (data) => {
  console.log("\n📡 SOCKET LOCATION RECEIVE");
  console.log("👉 from buddy:", socket.userId);
  console.log("👉 data:", data);

  try {
    if (socket.role !== "buddy") {
      console.log("❌ Not a buddy, ignoring");
      return;
    }

    const { bookingId, lat, lng } = data;

    if (!bookingId || lat == null || lng == null) {
      console.log("❌ Invalid payload");
      return;
    }

    /*
    =========================
    REDIS STORE (OPTIONAL)
    =========================
    */
    await redis.set(
      `booking:${bookingId}:location`,
      JSON.stringify({ lat, lng }),
      "EX",
      300
    );

    console.log("💾 Location saved in Redis");

    /*
    =========================
    EMIT TO ROOM
    =========================
    */
    io.to(`booking:${bookingId}`).emit(
      SOCKET_EVENTS.LOCATION_UPDATE,
      {
        bookingId,
        buddyId: socket.userId,
        location: {
          latitude: lat,
          longitude: lng
        }
      }
    );

    console.log("📡 Location emitted to room:", `booking:${bookingId}`);

  } catch (err) {
    console.log("❌ LOCATION SOCKET ERROR", err);
  }
});
      /*
      ====================================
      DISCONNECT
      ====================================
      */

      socket.on("disconnect", async (reason) => {

        console.log("\n🔴 SOCKET DISCONNECTED");
        console.log("📄 REASON:", reason);

        try {

          await redis.del(`socket:${socket.userId}`);

          if (socket.role === "buddy") {

            const activeBooking = await redis.get(
              `buddy:active_booking:${socket.userId}`
            );

            const newStatus = activeBooking ? "busy" : "offline";

            await buddyModel.findByIdAndUpdate(
              socket.userId,
              {
                isOnline: false,
                socketId: null,
                lastSeenAt: new Date(),
                availabilityStatus: newStatus
              }
            );

            console.log("⚫ BUDDY OFFLINE");

            /*
            🔥 BROADCAST STATUS
            */

            io.emit(
              SOCKET_EVENTS.STATUS_UPDATE,
              {
                type: "buddy_presence",
                buddyId: socket.userId,
                isOnline: false,
                availabilityStatus: newStatus
              }
            );
          }

        } catch (err) {
          console.log("❌ DISCONNECT ERROR", err);
        }
      });

    } catch (err) {
      console.log("❌ SOCKET CONNECTION ERROR", err);
      socket.disconnect(true);
    }
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};