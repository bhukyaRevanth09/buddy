import mongoose from "mongoose";
import dotenv from "dotenv";

import redis from "./Config/redis.js";
import buddyModel from "./models/BuddySchema.js";
import instantBookingModel from "./models/instantBooking.js";

dotenv.config();

const resetBookingSystem = async () => {
  try {
    console.log("🔄 Connecting MongoDB...");

    if (!process.env.MONGO_DB) {
      throw new Error("MONGO_DB missing in .env");
    }

    await mongoose.connect(process.env.MONGO_DB);

    console.log("✅ MongoDB connected");

    const redisPatterns = [
      "booking:pending:*",
      "booking:active:*",
      "booking:accept:*",
      "user:active_booking:*",
      "buddy:active_booking:*",
      "booking:*:location",
      "status:*"
    ];

    for (const pattern of redisPatterns) {
      const keys = await redis.keys(pattern);
      console.log(`🔍 ${pattern}: ${keys.length}`);

      if (keys.length > 0) {
        await redis.del(...keys);
      }
    }

    const deleteResult = await instantBookingModel.deleteMany({
      status: {
        $in: ["searching", "accepted", "arrived", "started", "failed", "cancelled"]
      }
    });

    console.log("🗑️ Instant bookings deleted:", deleteResult.deletedCount);

    const buddyResult = await buddyModel.updateMany(
      {},
      {
        $set: {
          currentBooking: null,
          availabilityStatus: "available",
          accountStatus: "active",
          isOnline: true,
          lastSeenAt: new Date()
        }
      }
    );

    console.log("🟢 Buddies reset:", buddyResult.modifiedCount);
    console.log("✅ BOOKING SYSTEM RESET DONE");

    await redis.quit();
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.log("❌ RESET ERROR:", err);

    try {
      await redis.quit();
      await mongoose.disconnect();
    } catch {}

    process.exit(1);
  }
};

resetBookingSystem();