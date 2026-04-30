import { Worker } from "bullmq";
import redis from "../Config/redis.js";
import { getIO } from "../services/Socket.js";
import { bookingQueue } from "../Config/queueConfig.js";
import { lockBuddy,unlockBuddy } from "./bookingLock.js";

const connection = {
host: "127.0.0.1",
port: 6379
};

export const startBookingWorker = () => {
  new Worker(
    "bookingQueue",
    async (job) => {

      if (job.name !== "check-acceptance") return;

      const { bookingId } = job.data;

      const raw = await redis.get(`pending_booking:${bookingId}`);
      if (!raw) return;

      const state = JSON.parse(raw);

      const current = state.buddies[state.currentIndex];

      // 🔓 unlock previous
      await unlockBuddy(current.id);

      const nextIndex = state.currentIndex + 1;

      if (nextIndex >= state.buddies.length) {
        getIO()
          .to(state.user.toString())
          .emit("booking-failed");

        await redis.del(`pending_booking:${bookingId}`);
        return;
      }

      const next = state.buddies[nextIndex];

      const locked = await lockBuddy(next.id);

      if (!locked) {
        state.currentIndex = nextIndex;

        await redis.set(
          `pending_booking:${bookingId}`,
          JSON.stringify(state),
          "EX",
          600
        );

        await bookingQueue.add(
          "check-acceptance",
          { bookingId },
          { delay: 0 }
        );

        return;
      }

      // ✅ send full data
      getIO().to(next.id).emit("new-booking-request", {
        bookingId,
        distance: (next.distance / 1000).toFixed(2)
      });

      state.currentIndex = nextIndex;

      await redis.set(
        `pending_booking:${bookingId}`,
        JSON.stringify(state),
        "EX",
        600
      );

      await bookingQueue.add(
        "check-acceptance",
        { bookingId },
        { delay: 20000 }
      );

    },
    { connection }
  );
};