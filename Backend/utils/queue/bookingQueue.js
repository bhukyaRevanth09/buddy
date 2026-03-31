import { Queue } from "bullmq";
import redis from "../../Config/redis.js";

export const bookingQueue = new Queue("bookingQueue", {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: true
  }
});