import { useEffect } from "react";
import * as Haptics from "expo-haptics";
import { SOCKET_EVENTS } from "../evenets/frontendsocketEvents";

export const useBuddySocket = ({
  socket,
  isOnline,
  setIncomingRequest
}) => {

  useEffect(() => {

    if (!socket) return;

    /*
    =========================
    NORMALIZE LOCATION (IMPORTANT)
    =========================
    */
    const normalizeLocation = (loc) => {
      if (!loc) return null;

      // Case 1: { latitude, longitude }
      if (loc.latitude && loc.longitude) {
        return {
          latitude: Number(loc.latitude),
          longitude: Number(loc.longitude)
        };
      }

      // Case 2: { lat, lng }
      if (loc.lat && loc.lng) {
        return {
          latitude: Number(loc.lat),
          longitude: Number(loc.lng)
        };
      }

      // Case 3: GeoJSON { coordinates: [lng, lat] }
      if (Array.isArray(loc.coordinates)) {
        return {
          latitude: Number(loc.coordinates[1]),
          longitude: Number(loc.coordinates[0])
        };
      }

      return null;
    };

    /*
    =========================
    NEW BOOKING
    =========================
    */
    const onBookingNew = (data) => {

      if (!isOnline) return;

      console.log("📥 BOOKING_NEW RAW:", JSON.stringify(data, null, 2));

      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Warning
      );

      const rawLocation =
        data?.pickupLocation ||
        data?.location ||
        data?.destination ||
        data?.address?.location ||
        null;

      const pickupLocation = normalizeLocation(rawLocation);

      const formatted = {
        bookingId: data.bookingId,
        customerName: data.customerName || "Customer",

        // handle both string + object
        address:
          typeof data.address === "string"
            ? data.address
            : data.address?.fullAddress || "Unknown",

        distance: Number(data.distance || 0).toFixed(2),

        pickupLocation
      };

      console.log("✅ FORMATTED REQUEST:", formatted);

      if (!pickupLocation) {
        console.log("❌ LOCATION NORMALIZATION FAILED:", rawLocation);
      }

      setIncomingRequest(formatted);
    };

    /*
    =========================
    CLEAR EVENTS
    =========================
    */
    const clearRequest = (eventName, data) => {
      console.log(`📡 ${eventName}:`, data);
      setIncomingRequest(null);
    };

    socket.on(SOCKET_EVENTS.BOOKING_NEW, onBookingNew);

    socket.on(SOCKET_EVENTS.BOOKING_CANCELLED, (d) =>
      clearRequest("BOOKING_CANCELLED", d)
    );

    socket.on(SOCKET_EVENTS.BOOKING_TIMEOUT, (d) =>
      clearRequest("BOOKING_TIMEOUT", d)
    );

    socket.on(SOCKET_EVENTS.BOOKING_REJECTED, (d) =>
      clearRequest("BOOKING_REJECTED", d)
    );

    /*
    =========================
    CLEANUP
    =========================
    */
    return () => {
      socket.off(SOCKET_EVENTS.BOOKING_NEW, onBookingNew);
      socket.off(SOCKET_EVENTS.BOOKING_CANCELLED);
      socket.off(SOCKET_EVENTS.BOOKING_TIMEOUT);
      socket.off(SOCKET_EVENTS.BOOKING_REJECTED);
    };

  }, [socket, isOnline]);
};