import { Worker } from 'bullmq';
import redis from '../Config/redis.js';
import instantBookingModel from '../models/instantBooking.js';
import { getIO } from '../services/Socket.js';
import { bookingQueue } from '../Config/queueConfig.js';

const connection = { host: '127.0.0.1', port: 6379 };



export const startBookingWorker = () => {
  const worker = new Worker(
    "bookingQueue",
    async (job) => {
      if (job.name !== "check-acceptance") return;

      const { bookingId } = job.data;

      // 🔥 get from redis (NOT Mongo)
      const raw = await redis.get(`pending_booking:${bookingId}`);
      if (!raw) return;

      const state = JSON.parse(raw);

      const nextIndex = state.currentIndex + 1;

      // more buddies available
      if (nextIndex < state.buddies.length) {
        state.currentIndex = nextIndex;

        const nextBuddyId = state.buddies[nextIndex];

        await redis.set(
          `pending_booking:${bookingId}`,
          JSON.stringify(state),
          "EX",
          3600
        );

        // notify next buddy
        getIO().to(nextBuddyId).emit("new-booking-request", {
          bookingId,
          customerName: state.customerName,
          categoryName: state.categoryName,
          skills: state.skillNames,
        });

        await bookingQueue.add(
          "check-acceptance",
          { bookingId },
          { delay: 25000 }
        );
      } else {
        // no buddies left
        getIO()
          .to(state.user.toString())
          .emit("booking-failed", {
            message: "No buddies responded",
          });

        await redis.del(`pending_booking:${bookingId}`);
      }
    },
    { connection }
  );

  worker.on("failed", (job, err) =>
    console.log(`Job ${job.id} failed: ${err.message}`)
  );
};