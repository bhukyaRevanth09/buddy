import redis from "../Config/redis";

export const lockBuddy = async (buddyId) => {
  const lockKey = `buddy:${buddyId}:lock`;

  const result = await redis.set(lockKey, "locked", "NX", "EX", 120);
  
  return result; // null = already locked
};

export const unlockBuddy = async (buddyId) => {
  const lockKey = `buddy:${buddyId}:lock`;
  await redis.del(lockKey);
};