import { useEffect, useState } from "react";

export default function useBuddyLocation(socket) {

  const [buddyLocation, setBuddyLocation] = useState(null);

  useEffect(() => {
    if (!socket) return;

    const handler = (data) => {
      setBuddyLocation({
        latitude: data.location?.latitude || data.lat,
        longitude: data.location?.longitude || data.lng,
        buddyId: data.buddyId
      });
    };

    socket.on("update_location", handler);

    return () => socket.off("update_location", handler);

  }, [socket]);

  return buddyLocation;
}