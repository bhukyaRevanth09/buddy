import { useEffect, useState } from "react";

export default function useBookingStatusListener(socket, bookingId, navigation) {

  const [status, setStatus] = useState("accepted");

  useEffect(() => {
    if (!socket || !bookingId) return;

    const onStart = (data) => {
      if (data.bookingId === bookingId) {
        setStatus("started");
      }
    };

    const onComplete = (data) => {
      if (data.bookingId === bookingId) {
        setStatus("completed");
        navigation.replace("Home");
      }
    };

    socket.on("tracking_started", onStart);
    socket.on("booking_completed", onComplete);

    return () => {
      socket.off("tracking_started", onStart);
      socket.off("booking_completed", onComplete);
    };

  }, [socket, bookingId]);

  return status;
}