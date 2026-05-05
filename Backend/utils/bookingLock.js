import redis from "../config/redis.js";

export const lockBuddy = async (buddyId) => {

  const result = await redis.set(
    `buddy:lock:${buddyId}`,
    "locked",
    "NX",
    "EX",
    30
  );

  return result === "OK";
};

export const unlockBuddy = async (buddyId) => {

  await redis.del(`buddy:lock:${buddyId}`);

};