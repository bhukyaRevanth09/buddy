import { useEffect, useState } from "react";
import { SOCKET_EVENTS } from "../evenets/frontendsocketEvents";

export default function useBuddyLocation(socket) {

  const [buddyLocation, setBuddyLocation] = useState(null);

  useEffect(() => {
    if (!socket) return;

    /*
    =========================
    LOCATION UPDATE HANDLER
    =========================
    */
    const handler = (data) => {

      if (!data) return;

      // ✅ support both formats (safe fallback)
      const latitude =
        data?.location?.latitude || data?.lat || data?.latitude;

      const longitude =
        data?.location?.longitude || data?.lng || data?.longitude;

      if (!latitude || !longitude) return;

      setBuddyLocation({
        latitude,
        longitude,
        buddyId: data?.buddyId || null
      });
    };

    /*
    =========================
    SOCKET LISTENER
    =========================
    */
    socket.on(SOCKET_EVENTS.LOCATION_UPDATE, handler);

    /*
    =========================
    CLEANUP
    =========================
    */
    return () => {
      socket.off(SOCKET_EVENTS.LOCATION_UPDATE, handler);
    };

  }, [socket]);

  return buddyLocation;
}