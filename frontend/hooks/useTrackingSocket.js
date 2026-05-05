// hooks/useTrackingSocket.js

import { useEffect, useState } from "react";
import { SOCKET_EVENTS } from "../evenets/frontendsocketEvents";

export default function useTrackingSocket(socket, bookingId) {

  const [buddyLocation, setBuddyLocation] = useState(null);
  const [trackingStatus, setTrackingStatus] = useState("waiting");
  const [workStarted, setWorkStarted] = useState(false);
  const [workCompleted, setWorkCompleted] = useState(false);

  useEffect(() => {

    if (!socket || !bookingId) return;

    /*
    =========================
    JOIN ROOM
    =========================
    */
    socket.emit(SOCKET_EVENTS.BOOKING_JOIN, bookingId);

    /*
    =========================
    LOCATION UPDATE
    =========================
    */
    const onLocationUpdate = (data) => {

      if (!data || data.bookingId !== bookingId) return;

      // ✅ flexible payload handling
      const latitude =
        data?.location?.latitude || data?.lat || data?.latitude;

      const longitude =
        data?.location?.longitude || data?.lng || data?.longitude;

      if (!latitude || !longitude) return;

      setBuddyLocation({
        latitude,
        longitude
      });

      setTrackingStatus("moving");
    };

    /*
    =========================
    TRACKING STARTED
    =========================
    */
    const onTrackingStarted = (data) => {

      if (data?.bookingId !== bookingId) return;

      setTrackingStatus("moving");
    };

    /*
    =========================
    WORK STARTED
    =========================
    */
    const onWorkStarted = (data) => {

      if (data?.bookingId !== bookingId) return;

      setWorkStarted(true);
    };

    /*
    =========================
    WORK COMPLETED
    =========================
    */
    const onWorkCompleted = (data) => {

      if (data?.bookingId !== bookingId) return;

      setWorkCompleted(true);
      setTrackingStatus("completed");
    };

    /*
    =========================
    TRACKING ENDED (safety)
    =========================
    */
    const onTrackingEnded = (data) => {

      if (data?.bookingId !== bookingId) return;

      setTrackingStatus("completed");
    };

    /*
    =========================
    SOCKET LISTENERS
    =========================
    */
    socket.on(SOCKET_EVENTS.LOCATION_UPDATE, onLocationUpdate);
    socket.on(SOCKET_EVENTS.TRACKING_STARTED, onTrackingStarted);
    socket.on(SOCKET_EVENTS.WORK_STARTED, onWorkStarted);
    socket.on(SOCKET_EVENTS.WORK_COMPLETED, onWorkCompleted);
    socket.on(SOCKET_EVENTS.TRACKING_ENDED, onTrackingEnded);

    /*
    =========================
    CLEANUP
    =========================
    */
    return () => {

      socket.emit(SOCKET_EVENTS.BOOKING_LEAVE, bookingId);

      socket.off(SOCKET_EVENTS.LOCATION_UPDATE, onLocationUpdate);
      socket.off(SOCKET_EVENTS.TRACKING_STARTED, onTrackingStarted);
      socket.off(SOCKET_EVENTS.WORK_STARTED, onWorkStarted);
      socket.off(SOCKET_EVENTS.WORK_COMPLETED, onWorkCompleted);
      socket.off(SOCKET_EVENTS.TRACKING_ENDED, onTrackingEnded);
    };

  }, [socket, bookingId]);

  return {
    buddyLocation,
    trackingStatus,
    workStarted,
    workCompleted
  };
}