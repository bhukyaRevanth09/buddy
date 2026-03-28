import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking"
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    buddy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Buddy"
    },

    rating: {
      type: Number,
      min: 1,
      max: 5
    },

    comment: String
  },
  { timestamps: true }
);

const reviewModel =  mongoose.model("Review", reviewSchema);

export default reviewModel