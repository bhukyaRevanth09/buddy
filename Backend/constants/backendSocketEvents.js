export const SOCKET_EVENTS = {
  /*
  =========================
  CONNECTION
  =========================
  */
  CONNECTION_READY: "connection:ready",

  /*
  =========================
  BOOKING FLOW
  =========================
  */

  // User starts booking
  BOOKING_NEW: "booking:new",

  // Searching state (useful for UI loader)
  BOOKING_SEARCHING: "booking:searching",

  // Buddy accepted request
  BOOKING_ACCEPTED: "booking:accepted",

  // Buddy rejected request
  BOOKING_REJECTED: "booking:rejected",

  // ⏱️ Buddy didn’t respond in time
  BOOKING_TIMEOUT: "booking:timeout",

  // Booking cancelled by user
  BOOKING_CANCELLED: "booking:cancelled",

  // No buddies found / failed
  BOOKING_FAILED: "booking:failed",

  // Final confirmation after accept
  BOOKING_CONFIRMED: "booking:confirmed",

  /*
  =========================
  TRACKING (REAL-TIME)
  =========================
  */

TRACKING_STARTED: "tracking:started",
TRACKING_ENDED: "tracking:ended",

// buddy app -> backend
LOCATION_UPDATE_SEND: "location:update:send",

// backend -> user/buddy room
LOCATION_UPDATE: "location:update",

  LOCATION_UPDATE: "location:update",

  /*
  =========================
  STATUS
  =========================
  */

  STATUS_UPDATE: "status:update",

  /*
  =========================
  WORK FLOW
  =========================
  */

  WORK_STARTED: "work:started",
  WORK_COMPLETED: "work:completed",

  BUDDY_ARRIVED: "buddy:arrived",

  /*
  =========================
  ROOM MANAGEMENT
  =========================
  */

  BOOKING_JOIN: "booking:join",
  BOOKING_LEAVE: "booking:leave",

  /*
  =========================
  OTP
  =========================
  */

  OTP_GENERATED: "booking:otp",
};