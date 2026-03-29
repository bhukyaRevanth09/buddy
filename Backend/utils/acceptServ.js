import { subscriber } from "../services/redis.js";
import Redis from "ioredis";

export const waitForAcceptance = (bookingId, timeout = 10000) => {
  return new Promise((resolve) => {

    const sub = new Redis(); // ✅ new instance

    const channel = `booking:${bookingId}`;

    const timer = setTimeout(() => {
      sub.unsubscribe(channel);
      sub.quit();
      resolve(false);
    }, timeout);

    sub.subscribe(channel);

    sub.on("message", (ch, message) => {
      if (ch === channel && message === "accepted") {
        clearTimeout(timer);
        sub.unsubscribe(channel);
        sub.quit();
        resolve(true);
      }
    });
  });
};