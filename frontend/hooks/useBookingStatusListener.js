import { useEffect, useState } from "react";
import { SOCKET_EVENTS } from "../evenets/frontendsocketEvents";

export default function useBookingStatusListener(socket, bookingId, navigation) {

  const [status, setStatus] = useState("accepted");

  useEffect(() => {
    if (!socket || !bookingId) return;

    /*
    =========================
    WORK STARTED
    =========================
    */
    const onWorkStarted = (data) => {
      if (data?.bookingId !== bookingId) return;

      setStatus("started");
    };

    /*
    =========================
    WORK COMPLETED
    =========================
    */
    const onWorkCompleted = (data) => {
      if (data?.bookingId !== bookingId) return;

      setStatus("completed");

      // ✅ redirect safely
      navigation.replace("Home");
    };

    /*
    =========================
    TRACKING ENDED (fallback safety)
    =========================
    */
    const onTrackingEnded = (data) => {
      if (data?.bookingId !== bookingId) return;

      setStatus("completed");

      navigation.replace("Home");
    };

    /*
    =========================
    SOCKET LISTENERS
    =========================
    */
    socket.on(SOCKET_EVENTS.WORK_STARTED, onWorkStarted);
    socket.on(SOCKET_EVENTS.WORK_COMPLETED, onWorkCompleted);
    socket.on(SOCKET_EVENTS.TRACKING_ENDED, onTrackingEnded);

    /*
    =========================
    CLEANUP
    =========================
    */
    return () => {
      socket.off(SOCKET_EVENTS.WORK_STARTED, onWorkStarted);
      socket.off(SOCKET_EVENTS.WORK_COMPLETED, onWorkCompleted);
      socket.off(SOCKET_EVENTS.TRACKING_ENDED, onTrackingEnded);
    };

  }, [socket, bookingId]);

  return status;
}