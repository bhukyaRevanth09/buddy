import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { updateLiveLocation,getLiveLocation } from "../Controllers/booking/updateLiveLocation.js";

const locationRouter = express.Router();


// buddy sends location
locationRouter.post(
  "/update",
  authMiddleware,
  updateLiveLocation
);

// user fetch fallback
locationRouter.get(
  "/:bookingId",
  authMiddleware,
  getLiveLocation
);



export default locationRouter

