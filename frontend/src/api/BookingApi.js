import api from "./Apiclient.js";

// USER — Request buddy
export const requestBuddy = async (payload) => {

  const res = await api.post(
    "/booking/request",
    payload
  );

  return res.data;

};

// BUDDY — Accept booking
export const acceptBooking = async (bookingId) => {

  const res = await api.post(
    "/booking/accept",
    { bookingId }
  );

  return res.data;

};

// BUDDY — Reject booking
export const rejectBooking = async (bookingId) => {

  const res = await api.post(
    "/booking/cancel",
    { bookingId }
  );

  return res.data;

};

// USER — Cancel booking
export const cancelBooking = async (bookingId) => {

  const res = await api.post(
    "/booking/cancel",
    { bookingId }
  );

  return res.data;

};