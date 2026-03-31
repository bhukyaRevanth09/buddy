import { Worker } from "bullmq";
import IORedis from "ioredis";
import instantBookingModel from "../models/instantBooking.js";
import buddyModel from "../models/BuddySchema.js";

const connection = new IORedis({
  maxRetriesPerRequest: null,
});
console.log('worker working')

const worker = new Worker(
  "bookingQueue",
  async (job) => {

    const { bookingId, buddies, index } = job.data;

    console.log("🔁 Processing booking:", bookingId);

    const booking = await instantBookingModel.findById(bookingId);

    if (!booking || booking.status !== "pending") return;

    const nextIndex = index + 1;

    if (nextIndex >= buddies.length) {
      await instantBookingModel.findByIdAndUpdate(bookingId, {
        status: "cancelled"
      });

      console.log(" Booking cancelled:", bookingId);
      return;
    }

    const nextBuddyId = buddies[nextIndex];

    await instantBookingModel.findByIdAndUpdate(bookingId, {
      buddy: nextBuddyId
    });

    const prevBuddyId = buddies[index];
    await buddyModel.findByIdAndUpdate(prevBuddyId, {
      availabilityStatus: "available",
      currentBooking: null
    });

    console.log(" Assigning to next buddy:", nextBuddyId);

    // 🔥 Notify via Redis Pub/Sub
    await connection.publish(
      "booking-channel",
      JSON.stringify({
        bookingId,
        buddyId: nextBuddyId
      })
    );

    // 🔁 Retry next
    await job.queue.add(
      "retry-booking",
      {
        bookingId,
        buddies,
        index: nextIndex
      },
      {
        delay: 10000,
        removeOnComplete: true
      }
    );

  },
  {
    connection,
    removeOnComplete: true,
    removeOnFail: true
  }
);

worker.on("completed", job => {
  console.log(`✅ Job completed: ${job.id}`);
});

worker.on("failed", (job, err) => {
  console.log(` Job failed: ${err.message}`);
});