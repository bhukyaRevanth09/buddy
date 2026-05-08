import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InstantBooking",
      required: true,
      unique: true
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true
    },

    buddy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Buddy",
      required: true,
      index: true
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },

    comment: {
      type: String,
      trim: true,
      default: ""
    }
  },
  { timestamps: true }
);

const reviewModel =  mongoose.models.Review ||
  mongoose.model("Review", reviewSchema);
  export default reviewModel