import React, {
  createContext,
  useEffect,
  useState,
  useContext
} from "react";

import api from "../api/Apiclient";
import { SocketContext } from "./socketContext.js";
import { SOCKET_EVENTS } from "../../evenets/frontendsocketEvents.js";
export const BookingContext = createContext();

export const BookingProvider = ({ children }) => {

  const { socket } = useContext(SocketContext);

  const [activeBooking, setActiveBooking] = useState(null);

  const [loading, setLoading] = useState(true);

  const fetchActiveBooking = async () => {

    try {

      const res = await api.get("/booking/active");

      if (res.data.success && res.data.data) {

        const booking = res.data.data;

        setActiveBooking(booking);

        socket?.emit(
          SOCKET_EVENTS.BOOKING_JOIN,
          {
            bookingId: booking._id
          }
        );

      } else {
        setActiveBooking(null);
      }

    } catch (err) {

      console.log("BOOKING FETCH ERROR", err);

      setActiveBooking(null);

    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async () => {

    try {

      if (!activeBooking) return;

      await api.post("/booking/cancel", {
        bookingId: activeBooking._id
      });

      socket?.emit(
        SOCKET_EVENTS.BOOKING_CANCELLED,
        {
          bookingId: activeBooking._id
        }
      );

      setActiveBooking(null);

    } catch (err) {
      console.log("CANCEL ERROR", err);
    }
  };

  useEffect(() => {

    if (!socket) return;

    const onTrackingStarted = (data) => {

      setActiveBooking(prev =>
        prev && prev._id === data.bookingId
          ? { ...prev, status: "tracking_started" }
          : prev
      );
    };

    const onArrived = (data) => {

      setActiveBooking(prev =>
        prev && prev._id === data.bookingId
          ? { ...prev, status: "arrived" }
          : prev
      );
    };

    const onCompleted = (data) => {

      setActiveBooking(prev =>
        prev && prev._id === data.bookingId
          ? { ...prev, status: "completed" }
          : prev
      );

      setTimeout(() => {
        setActiveBooking(null);
      }, 2000);
    };

    const onCancelled = (data) => {

      setActiveBooking(prev =>
        prev && prev._id === data.bookingId
          ? { ...prev, status: "cancelled" }
          : prev
      );

      setTimeout(() => {
        setActiveBooking(null);
      }, 1000);
    };

    socket.on(
      SOCKET_EVENTS.TRACKING_STARTED,
      onTrackingStarted
    );

    socket.on(
      SOCKET_EVENTS.BUDDY_ARRIVED,
      onArrived
    );

    socket.on(
      SOCKET_EVENTS.WORK_COMPLETED,
      onCompleted
    );

    socket.on(
      SOCKET_EVENTS.BOOKING_CANCELLED,
      onCancelled
    );

    return () => {

      socket.off(
        SOCKET_EVENTS.TRACKING_STARTED,
        onTrackingStarted
      );

      socket.off(
        SOCKET_EVENTS.BUDDY_ARRIVED,
        onArrived
      );

      socket.off(
        SOCKET_EVENTS.WORK_COMPLETED,
        onCompleted
      );

      socket.off(
        SOCKET_EVENTS.BOOKING_CANCELLED,
        onCancelled
      );
    };

  }, [socket]);

  useEffect(() => {
    fetchActiveBooking();
  }, []);

  return (
    <BookingContext.Provider
      value={{
        activeBooking,
        loading,
        setActiveBooking,
        fetchActiveBooking,
        cancelBooking
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};