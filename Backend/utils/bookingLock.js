import redis from "../Config/redis.js";

export const lockBuddy = async (buddyId) => {
  const res = await redis.set(
    `buddy:${buddyId}:lock`,
    "1",
    "NX",
    "EX",
    120
  );

  return res === "OK";
};

export const unlockBuddy = async (buddyId) => {
  await redis.del(`buddy:${buddyId}:lock`);
};