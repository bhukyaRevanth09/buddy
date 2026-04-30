import mongoose from "mongoose";

const buddySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },

  email: { type: String, required: true, unique: true, lowercase: true },

  phone: { type: String, required: true, unique: true },

  password: { type: String, required: true, select: false },

  role: { type: String, default: "buddy" },

  gender: {
    type: String,
    enum: ["Male", "Female", "Other", "Prefer not to say"],
    default: "Prefer not to say"
  },

  // 🔥 FIXED (ObjectId)
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
    index: true
  },

  skills: [{ type: String, index: true }],
  interests: [{ type: String, index: true }],

  education: { type: String },

  pricePerHour: { type: Number, required: true },

  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },

  /*
  =========================
  GEO LOCATION (SEARCH)
  =========================
  Used for finding nearby buddies
  */
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

  /*
  =========================
  LIVE LOCATION (TRACKING)
  =========================
  Used for real-time tracking
  */
  currentLocation: {
    latitude: Number,
    longitude: Number,
    updatedAt: Date
  },

  /*
  =========================
  STATUS
  =========================
  */
  accountStatus: {
    type: String,
    enum: ["active", "suspended", "blocked", "pending"],
    default: "pending",
    index: true
  },

  availabilityStatus: {
    type: String,
    enum: ["available", "busy", "offline"],
    default: "offline",
    index: true
  },

  isOnline: { type: Boolean, default: false, index: true },

  socketId: String,
  fcmToken: String,

  /*
  =========================
  RATING
  =========================
  */
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },

  totalBooking: { type: Number, default: 0 },

  earnings: {
    total: { type: Number, default: 0 },
    today: { type: Number, default: 0 },
    thisMonth: { type: Number, default: 0 }
  },

  currentBooking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "InstantBooking",
    default: null,
    index: true
  }

}, { timestamps: true });

/*
=========================
INDEXES (IMPORTANT)
=========================
*/

// 🔥 Required for geo queries
buddySchema.index({ geoLocation: "2dsphere" });

// 🔥 Fast filtering
buddySchema.index({
  accountStatus: 1,
  availabilityStatus: 1,
  category: 1
});

// 🔥 Optional (if you track live)
buddySchema.index({
  "currentLocation.latitude": 1,
  "currentLocation.longitude": 1
});

const buddyModel =
  mongoose.models.Buddy ||
  mongoose.model("Buddy", buddySchema);

export default buddyModel;