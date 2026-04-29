import { Worker } from "bullmq";
import redis from "../Config/redis.js";
import { getIO } from "../services/Socket.js";
import { bookingQueue } from "../Config/queueConfig.js";
import { lockBuddy,unlockBuddy } from "./bookingLock.js";

const connection = {
host: "127.0.0.1",
port: 6379
};

export const startBookingWorker = () => {

const worker = new Worker(
"bookingQueue",
async (job) => {

if (job.name !== "check-acceptance") return;

const { bookingId } = job.data;

const raw =
await redis.get(`pending_booking:${bookingId}`);

if (!raw) return;

const state = JSON.parse(raw);

/*
UNLOCK PREVIOUS
*/

const prevBuddy =
state.buddies[state.currentIndex];

await unlockBuddy(prevBuddy);

const nextIndex =
state.currentIndex + 1;

/*
NO MORE BUDDIES
*/

if (nextIndex >= state.buddies.length) {

getIO()
.to(state.user.toString())
.emit("booking-failed");

await redis.del(
`pending_booking:${bookingId}`
);

return;
}

/*
TRY NEXT
*/

const nextBuddyId =
state.buddies[nextIndex];

const locked =
await lockBuddy(nextBuddyId);

/*
IF LOCKED TRY NEXT
*/

if (!locked) {

state.currentIndex = nextIndex;

await redis.set(
`pending_booking:${bookingId}`,
JSON.stringify(state),
"EX",
3600
);

await bookingQueue.add(
"check-acceptance",
{ bookingId },
{ delay: 0 }
);

return;
}

/*
SEND REQUEST
*/

state.currentIndex = nextIndex;

await redis.set(
`pending_booking:${bookingId}`,
JSON.stringify(state),
"EX",
3600
);

getIO()
.to(nextBuddyId)
.emit("new-booking-request", {
bookingId
});

/*
QUEUE AGAIN
*/

await bookingQueue.add(
"check-acceptance",
{ bookingId },
{ delay: 20000 }
);

},
{ connection }
);

worker.on("failed", (job, err) =>
console.log("Worker failed:", err)
);

};