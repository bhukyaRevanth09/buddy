import redis from "../../Config/redis.js";

export const saveBookingState =
async (bookingId, state) => {

  await redis.set(
    `booking:pending:${bookingId}`,
    JSON.stringify(state),
    "EX",
    600
  );

};

export const getBookingState =
async (bookingId) => {

  const raw = await redis.get(
    `booking:pending:${bookingId}`
  );

  if (!raw) return null;

  return JSON.parse(raw);

};

export const clearBookingState =
async (bookingId) => {

  await redis.del(
    `booking:pending:${bookingId}`
  );

};