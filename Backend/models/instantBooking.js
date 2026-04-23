import mongoose from "mongoose";

const instantBookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Added for faster history lookups
    },
    buddy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Buddy",
      default: null,
      index: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    serviceType: {
      type: String,
    },
    requestedSkills: [{
      type: String,
    }],
    // FIX: Simplified GeoJSON structure to avoid .coordinates.coordinates
    location: {
      address: { type: String },
      type: { 
        type: String, 
        enum: ["Point"], 
        default: "Point" 
      },
      coordinates: { 
        type: [Number], 
        required: true 
      }, // [longitude, latitude]
    },
    pricing: {
      totalAmount: { type: Number, required: true },
      currency: { type: String, default: "INR" },
    },
    status: {
      type: String,
      enum: ["searching", "accepted", "arrived", "started", "completed", "cancelled", "failed"],
      default: "searching",
      index: true,
    },
    acceptedAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
  },
  { timestamps: true }
);

// Correct index path for the new structure
instantBookingSchema.index({ "location": "2dsphere" });

const instantBookingModel = mongoose.models.InstantBooking || mongoose.model("InstantBooking", instantBookingSchema);

export default instantBookingModel;