import { useEffect } from "react";

export default function useLiveTracking(socket, bookingId) {

  useEffect(() => {
    if (!socket || !bookingId) return;

    socket.emit("join_booking_room", bookingId);

  }, [socket, bookingId]);
}