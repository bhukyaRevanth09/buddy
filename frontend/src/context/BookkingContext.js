import React, {
  createContext,
  useState,
  useContext,
  useEffect
} from "react";

import api from "../api/Apiclient.js";
import { SocketContext } from "./socketContext.js";

export const BookingContext = createContext();

export const BookingProvider = ({ children }) => {

  const { socket } = useContext(SocketContext);

  const [activeBooking, setActiveBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  /*
  ==============================
  FETCH ACTIVE BOOKING
  ==============================
  */
  const fetchActiveBooking = async () => {
    try {
      const res = await api.get("/booking/active");

      if (res.data.success) {
        setActiveBooking(res.data.data);

        // join booking room
        socket?.emit("join_booking_room", res.data.data._id);
      } else {
        setActiveBooking(null);
      }

    } catch (err) {
      console.log("Booking fetch error:", err);
      setActiveBooking(null);
    } finally {
      setLoading(false);
    }
  };

  /*
  ==============================
  CANCEL BOOKING
  ==============================
  */
  const cancelBooking = async () => {
    try {
      if (!activeBooking) return;

      await api.post("/booking/cancel", {
        bookingId: activeBooking._id
      });

      setActiveBooking(null);

      socket?.emit("booking_cancelled", {
        bookingId: activeBooking._id
      });

    } catch (err) {
      console.log("Cancel error:", err);
    }
  };

  /*
  ==============================
  SOCKET LISTENERS (REALTIME CORE)
  ==============================
  */
  useEffect(() => {
    if (!socket) return;

    // 🟢 BUDDY STARTED JOB
    const onStarted = (data) => {
      setActiveBooking(prev =>
        prev && prev._id === data.bookingId
          ? { ...prev, status: "started" }
          : prev
      );
    };

    // 🟡 BUDDY ARRIVED (THIS FIXES YOUR ISSUE)
    const onArrived = (data) => {
      setActiveBooking(prev =>
        prev && prev._id === data.bookingId
          ? { ...prev, status: "arrived" }
          : prev
      );
    };

    // 🔴 COMPLETED
    const onCompleted = (data) => {
      setActiveBooking(prev =>
        prev && prev._id === data.bookingId
          ? { ...prev, status: "completed" }
          : prev
      );

      // optional cleanup
      setActiveBooking(null);
    };

    // ❌ CANCELLED
    const onCancelled = (data) => {
      setActiveBooking(prev =>
        prev && prev._id === data.bookingId
          ? { ...prev, status: "cancelled" }
          : prev
      );

      setActiveBooking(null);
    };

    socket.on("tracking_started", onStarted);
    socket.on("booking_arrived", onArrived);
    socket.on("booking_completed", onCompleted);
    socket.on("booking_cancelled", onCancelled);

    return () => {
      socket.off("tracking_started", onStarted);
      socket.off("booking_arrived", onArrived);
      socket.off("booking_completed", onCompleted);
      socket.off("booking_cancelled", onCancelled);
    };

  }, [socket]);

  /*
  ==============================
  INIT LOAD
  ==============================
  */
  useEffect(() => {
    fetchActiveBooking();
  }, []);

  return (
    <BookingContext.Provider
      value={{
        activeBooking,
        setActiveBooking,
        loading,
        fetchActiveBooking,
        cancelBooking
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

/*
CUSTOM HOOK
*/
export const useBooking = () => useContext(BookingContext);