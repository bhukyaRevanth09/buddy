import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import {
  createReview,
  getBuddyReviews
} from "../controllers/reviewController.js";

const reviewRouter = express.Router();

reviewRouter.post("/", authMiddleware, createReview);
reviewRouter.get("/buddy/:buddyId", authMiddleware, getBuddyReviews);

export default reviewRouter;