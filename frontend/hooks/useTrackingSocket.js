import { useEffect, useState, useRef } from "react";

export default function useTrackingSocket(socket, bookingId) {

  const [buddyLocation, setBuddyLocation] = useState(null);
  const [status, setStatus] = useState("accepted");

  const lastLocationRef = useRef(null);

  useEffect(() => {
    if (!socket || !bookingId) return;

    console.log("📦 Joining booking room:", bookingId);

    socket.emit("join_booking_room", bookingId);

    /*
    =========================
    LOCATION UPDATE
    =========================
    */
    const handleLocation = (data) => {
      if (!data || data.bookingId !== bookingId) return;

      const latitude = data.latitude ?? data.lat;
      const longitude = data.longitude ?? data.lng;

      if (!latitude || !longitude) return;

      const newLocation = { latitude, longitude };
      const last = lastLocationRef.current;

      // prevent unnecessary re-renders
      if (
        !last ||
        last.latitude !== newLocation.latitude ||
        last.longitude !== newLocation.longitude
      ) {
        lastLocationRef.current = newLocation;
        setBuddyLocation(newLocation);
      }
    };

    /*
    =========================
    STATUS EVENTS
    =========================
    */
    const handleStart = (data) => {
      if (data.bookingId === bookingId) {
        setStatus("started");
      }
    };

    const handleComplete = (data) => {
      if (data.bookingId === bookingId) {
        setStatus("completed");
      }
    };

    /*
    =========================
    LISTENERS
    =========================
    */
    socket.on("location_update", handleLocation);
    socket.on("tracking_started", handleStart);
    socket.on("booking_completed", handleComplete);

    /*
    =========================
    CLEANUP
    =========================
    */
    return () => {
      console.log("🚪 Leaving booking room:", bookingId);

      socket.off("location_update", handleLocation);
      socket.off("tracking_started", handleStart);
      socket.off("booking_completed", handleComplete);

      socket.emit("leave_booking_room", bookingId);
    };

  }, [socket, bookingId]);

  return { buddyLocation, status };
}