import mongoose from "mongoose";

const buddySchema = new mongoose.Schema({

  name: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },

  phone: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    default: "buddy"
  },

  skills: [
    {
      type: String
    }
  ],

  experience: {
    type: Number, // in years
    default: 0
  },

  pricePerHour: {
    type: Number,
    required: true,
    min: 0
  },

  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },

  // ✅ GEOJSON (for nearby search)
  geoLocation: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true
    }
  },

  availability: [
    {
      day: String,          // e.g. "Monday"
      slots: [String]       // e.g. ["10:00-12:00"]
    }
  ],

  documents: [
    {
      name: String,
      url: String
    }
  ],

  verificationStatus: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending"
  },

  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },

  totalReview: {
    type: Number,
    default: 0
  },

  totalBooking: {
    type: Number,
    default: 0
  },

  isOnline: {
    type: Boolean,
    default: false
  },

  earning: {
    type: Number,
    default: 0
  },

  // ✅ MAIN STATUS CONTROL
  availabilityStatus: {
    type: String,
    enum: ["available", "busy", "offline"],
    default: "available"
  },

  // ✅ TRACK CURRENT WORK
  currentBooking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "InstantBooking",
    default: null
  }

}, { timestamps: true });


// ✅ GEO INDEX (IMPORTANT)
buddySchema.index({ geoLocation: "2dsphere" });



const buddyModel = mongoose.model("Buddy", buddySchema);

export default buddyModel;