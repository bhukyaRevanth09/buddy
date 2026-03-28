import Redis from "ioredis";

export const publisher = new Redis({
  host: "127.0.0.1",
  port: 6379 
});

export const subscriber = new Redis({
  host: "127.0.0.1",
  port: 6379 
});



publisher.on("connect", () => {
  console.log("Publisher connected to Redis");
});

subscriber.on("connect", () => {
  console.log("Subscriber connected to Redis");
});

// ✅ Events
publisher.on("error", (err) => {
  console.log("Publisher Redis error:", err.message);
});

subscriber.on("error", (err) => {
  console.log("Subscriber Redis error:", err.message);
});