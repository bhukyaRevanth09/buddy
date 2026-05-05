import express from "express";

import authMiddleware
from "../middleware/authMiddleware.js";

import { requestBooking } from "../controllers/booking/requestBooking.js";
import { acceptBooking } from "../controllers/booking/acceptBooking.js";
import { arrivedBooking } from "../controllers/booking/arrivedBooking.js";
import {startWorking} from "../Controllers/booking/startwork.js"
import {completeWork} from "../Controllers/booking/completework.js"
import { cancelBooking } from "../controllers/booking/cancelBooking.js";
import { updateLiveLocation,getLiveLocation } from "../Controllers/booking/updateLiveLocation.js";
import { getActiveBooking } from "../Controllers/booking/getActiveBooking.js";
import { getBookingHistory } from "../Controllers/booking/getBookingHistory.js";
const bookingRouter = express.Router();

/*
=========================
USER
=========================
*/

bookingRouter.post(
  "/request",
  authMiddleware,
  requestBooking
);

/*
=========================
BUDDY
=========================
*/

bookingRouter.post(
  "/accept",
  authMiddleware,
  acceptBooking
);

bookingRouter.post(
  "/arrived",
  authMiddleware,
  arrivedBooking
);

bookingRouter.post(
  "/start",
  authMiddleware,
  startWorking
);

bookingRouter.post(
  "/complete",
  authMiddleware,
  completeWork
);



// USER BOOKINGS
bookingRouter.get("/active", authMiddleware, getActiveBooking);
bookingRouter.get("/history", authMiddleware, getBookingHistory);
/*
=========================
CANCEL
=========================
*/

bookingRouter.post(
  "/cancel",
  authMiddleware,
  cancelBooking
);






export default bookingRouter;