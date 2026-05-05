import { Worker } from "bullmq";

import bookingQueue, { connection } from "../Config/queueConfig.js";

import {
  getBookingState,
  saveBookingState,
  clearBookingState
} from "../services/booking/bookingState.js";

import { unlockBuddy } from "../utils/bookingLock.js";

import { dispatchBookingToBuddy } from "../services/Booking/bookingDispatchService.js";

import { notifyUser } from "../socket/socketEmitter.js";

import { SOCKET_EVENTS } from "../constants/backendSocketEvents.js";

import { getIO } from "../socket/socket.js";

export const startBookingWorker = () => {

  new Worker(
    "bookingQueue",

    async (job) => {

      if (job.name !== "booking-timeout") return;

      console.log("\n====================================");
      console.log("⏳ BOOKING TIMEOUT WORKER");
      console.log("====================================");

      const { bookingId } = job.data;

      console.log("📦 BOOKING ID:", bookingId);

      const state = await getBookingState(bookingId);

      if (!state) {
        console.log("❌ NO STATE FOUND");
        return;
      }

      const io = getIO();
      const bookingRoom = `booking:${bookingId}`;

      const currentBuddy = state.buddies[state.currentIndex];

      /*
      =========================
      UNLOCK CURRENT BUDDY
      =========================
      */

      if (currentBuddy) {
        await unlockBuddy(currentBuddy.id);
        console.log("🔓 UNLOCKED BUDDY:", currentBuddy.id);
      }

      const nextIndex = state.currentIndex + 1;

      /*
      =========================
      NO MORE BUDDIES
      =========================
      */

      if (nextIndex >= state.buddies.length) {

        console.log("❌ NO MORE BUDDIES");

        notifyUser(
          state.user,
          SOCKET_EVENTS.BOOKING_FAILED,
          {
            bookingId,
            message: "No buddies available",
          }
        );

        io.to(bookingRoom).emit(
          SOCKET_EVENTS.STATUS_UPDATE,
          {
            bookingId,
            status: "failed",
          }
        );

        await clearBookingState(bookingId);

        return;
      }

      /*
      =========================
      MOVE TO NEXT BUDDY
      =========================
      */

      state.currentIndex = nextIndex;

      await saveBookingState(bookingId, state);

      console.log("➡️ TRYING NEXT BUDDY:", nextIndex);

      /*
      =========================
      USER UPDATE (SEARCHING)
      =========================
      */

      notifyUser(
        state.user,
        SOCKET_EVENTS.BOOKING_NEW,
        {
          bookingId,
          status: "searching",
          attempt: nextIndex + 1,
        }
      );

      /*
      =========================
      ROOM UPDATE
      =========================
      */

      io.to(bookingRoom).emit(
        SOCKET_EVENTS.STATUS_UPDATE,
        {
          bookingId,
          status: "searching",
          currentIndex: nextIndex,
        }
      );

      /*
      =========================
      DISPATCH NEXT BUDDY
      =========================
      */

      const dispatched = await dispatchBookingToBuddy({
        bookingId,
        state,
      });

      /*
      =========================
      LOCK FAILED → RETRY
      =========================
      */

      if (!dispatched) {

        console.log("⚠️ DISPATCH FAILED → RETRY");

        await bookingQueue.add(
          "booking-timeout",
          { bookingId },
          { delay: 0 }
        );
      } else {
        console.log("✅ DISPATCHED TO NEXT BUDDY");
      }

    },

    { connection }

  );
};