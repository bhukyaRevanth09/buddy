import { lockBuddy } from "../../utils/bookingLock.js";
import redis from "../../Config/redis.js";
import bookingQueue from "../../Config/queueConfig.js";

import { notifyUser } from "../../socket/socketEmitter.js";
import { SOCKET_EVENTS } from "../../constants/backendSocketEvents.js";

export const dispatchBookingToBuddy = async ({ bookingId, state }) => {
  try {
    const currentBuddy = state.buddies[state.currentIndex];

    if (!currentBuddy) {
      console.log("❌ No buddy found at index:", state.currentIndex);
      return false;
    }

    const locked = await lockBuddy(currentBuddy.id);

    if (!locked) {
      console.log("🔒 Buddy already locked:", currentBuddy.id);
      return false;
    }

    state.assignedBuddy = currentBuddy.id;
    state.status = "searching";

    await redis.set(
      `booking:pending:${bookingId}`,
      JSON.stringify(state),
      "EX",
      600
    );

    const pickupLocation = {
      latitude: state.location.coordinates[1],
      longitude: state.location.coordinates[0],
    };

    const payload = {
      bookingId,
      customerName: state.customerName || "Customer",

      distance: Number((currentBuddy.distance / 1000).toFixed(2)),

      address: {
        fullAddress: state.address?.fullAddress || "Unknown",
        houseNo: state.address?.houseNo || "",
        road: state.address?.road || "",
        landmark: state.address?.landmark || "",
      },

      pickupLocation,
    };

    console.log("📤 DISPATCH PAYLOAD:", {
      bookingId,
      buddyId: currentBuddy.id,
      payload,
    });

    notifyUser(
      currentBuddy.id,
      SOCKET_EVENTS.BOOKING_NEW,
      payload
    );

    await bookingQueue.add(
      "booking-timeout",
      { bookingId },
      { delay: 20000 }
    );

    return true;
  } catch (err) {
    console.log("❌ DISPATCH ERROR:", err);
    return false;
  }
};