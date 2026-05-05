import { Queue } from "bullmq";

export const connection = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT || 6379
};

export const bookingQueue = new Queue(
  "bookingQueue",
  {
    connection,

    defaultJobOptions: {
      removeOnComplete: true,

      removeOnFail: 1000,

      attempts: 3,

      backoff: {
        type: "exponential",
        delay: 2000
      }
    }
  }
);

export default bookingQueue;