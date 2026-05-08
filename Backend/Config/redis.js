import IORedis from "ioredis";

const redis = new IORedis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null,
  enableReadyCheck: true,

  retryStrategy(times) {
    return Math.min(times * 50, 2000);
  }
});

redis.on("connect", () => {
  console.log(" Redis Connected");
});

redis.on("error", (err) => {
  console.log(" Redis Error:", err.message);
});

export default redis;