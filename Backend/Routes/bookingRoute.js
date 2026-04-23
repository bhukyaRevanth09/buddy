import express from 'express';
import { autoAssignBuddy,getBookingStatus,acceptBooking } from '../bookingController/autoasginbuddy.js';
import { cancelBooking } from '../bookingController/rejectBooking.js'; // Standardized to reject/cancel
import { completeWork } from '../bookingController/completework.js';
import { markArrived } from '../bookingController/arrivedController.js';
import authMiddleware from "../middleware/authMiddleware.js";
import { startWork } from '../bookingController/startwork.js';

const bookingRouter = express.Router()

// User only
bookingRouter.post('/request', authMiddleware, autoAssignBuddy);

// Buddy only
bookingRouter.post('/accept', authMiddleware, acceptBooking);
bookingRouter.post('/arrived', authMiddleware, markArrived);
bookingRouter.post('/complete', authMiddleware, completeWork);

// Both can check status
bookingRouter.get('/status/:bookingId', authMiddleware, getBookingStatus);
 
// Reject (Buddy) or Cancel (User)
bookingRouter.post('/cancel', authMiddleware, cancelBooking);

export default bookingRouter;