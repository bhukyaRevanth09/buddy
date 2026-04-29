import { useEffect, useState } from "react";

export const useLiveTracking = (socket, bookingId) => {

  const [buddyLocation, setBuddyLocation] = useState(null);

  useEffect(() => {

    if (!socket || !bookingId) return;

    socket.emit("join_booking_room", bookingId);

    const handleLocation = (data) => {
      setBuddyLocation({
        latitude: data.lat,
        longitude: data.lng
      });
    };

    socket.on("location_update", handleLocation);

    return () => {
      socket.off("location_update", handleLocation);
    };

  }, [socket, bookingId]);

  return buddyLocation;
};