import mongoose from "mongoose";

const postTaskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  title: {
    type: String,
    required: true
  },

  description: {
    type: String,
    required: true
  },

  budget: {
    type: Number
  },

  location: {
    address: String,
    lat: Number,
    lng: Number
  },

  status: {
    type: String,
    enum: ["open", "assigned", "completed", "cancelled"],
    default: "open"
  },

  assignedBuddy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Buddy"
  }

}, { timestamps: true });

const postBookingModel =  mongoose.model("PostTask", postTaskSchema);