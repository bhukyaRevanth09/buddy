import mongoose from "mongoose";

const serviceBookingSchema = new mongoose.Schema({
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

  scheduledDate: {
    type: Date,
    required: true
  },

  duration: {
    type: Number, // in hours
    required: true
  },

  price: {
    type: Number,
    required: true
  },

  address: {
    type: String
  },

  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "completed", "cancelled"],
    default: "pending"
  },

  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending"
  }

}, { timestamps: true });

const serviceBookingModel =  mongoose.model("ServiceBooking", serviceBookingSchema);

export default serviceBookingModel