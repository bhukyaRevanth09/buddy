import mongoose from "mongoose";

const instantBookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  buddy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Buddy",
    required: true
  },

  serviceType: {
    type: String,
    required: true
  },

  price: {
    type: Number,
    required: true
  },

  location: {
    address: String,
    lat: Number,
    lng: Number
  },

  status: {
    type: String,
    enum: ["pending", "accepted", "on-going", "completed", "cancelled"],
    default: "pending"
  },

  startedAt: Date,
  completedAt: Date,

  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending"
  }

}, { timestamps: true });

const instantBookingModel =  mongoose.model("InstantBooking", instantBookingSchema);
export default instantBookingModel