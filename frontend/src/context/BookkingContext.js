import React, { createContext, useState, useContext, useEffect } from "react";
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

        // join socket room automatically
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
  SOCKET LISTENERS
  ==============================
  */
  useEffect(() => {

    if (!socket) return;

    const onCancelled = () => {
      setActiveBooking(null);
    };

    const onCompleted = () => {
      setActiveBooking(null);
    };

    socket.on("booking_cancelled", onCancelled);
    socket.on("booking_completed", onCompleted);

    return () => {
      socket.off("booking_cancelled", onCancelled);
      socket.off("booking_completed", onCompleted);
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
==============================
CUSTOM HOOK
==============================
*/
export const useBooking = () => useContext(BookingContext);