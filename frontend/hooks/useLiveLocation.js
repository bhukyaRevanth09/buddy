import { useEffect, useState } from "react";

export const useLiveTracking = (socket, bookingId) => {

  const [buddyLocation, setBuddyLocation] = useState(null);

  useEffect(() => {

    if (!socket || !bookingId) return;

    socket.emit("join_booking_room", bookingId);

    socket.on("location_update", (data) => {

      setBuddyLocation({
        latitude: data.lat,
        longitude: data.lng
      });

    });

    return () => socket.off("location_update");

  }, [socket, bookingId]);

  return buddyLocation;
};