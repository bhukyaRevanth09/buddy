import mongoose from "mongoose";

const buddySchema = new mongoose.Schema(
  {
    /*
    =========================
    BASIC INFO
    =========================
    */
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      default: "buddy",
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other", "Prefer not to say"],
      default: "Prefer not to say",
    },

    /*
    =========================
    CATEGORY
    =========================
    */
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },

    /*
    =========================
    SKILLS
    =========================
    */
    skills: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Skill",
        required: true, // at least one enforced in controller
        index: true,
      },
    ],

    /*
    =========================
    INTERESTS
    =========================
    */
    interests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Interest",
        index: true,
      },
    ],

    education: {
      type: String,
    },

    /*
    =========================
    ADDRESS
    =========================
    */
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
    },

    /*
    =========================
    GEO LOCATION (FOR SEARCH)
    =========================
    */
    geoLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
      },
    },

    /*
    =========================
    LIVE LOCATION (OPTIONAL)
    =========================
    */
    currentLocation: {
      latitude: Number,
      longitude: Number,
      updatedAt: Date,
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
      index: true,
    },

    availabilityStatus: {
      type: String,
      enum: ["available", "busy", "offline"],
      default: "offline",
      index: true,
    },

    isOnline: {
      type: Boolean,
      default: false,
      index: true,
    },

    socketId: String,
    fcmToken: String,

    /*
    =========================
    RATING
    =========================
    */
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },

    totalBooking: {
      type: Number,
      default: 0,
    },

    lastSeenAt: Date,

    currentBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InstantBooking",
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

/*
=========================
INDEXES (IMPORTANT)
=========================
*/

// 🔥 GEO INDEX (required for $geoNear)
buddySchema.index({ geoLocation: "2dsphere" });

// 🔥 FAST FILTERING
buddySchema.index({
  accountStatus: 1,
  availabilityStatus: 1,
  isOnline: 1,
  category: 1,
});

// 🔥 OPTIONAL (tracking queries)
buddySchema.index({
  "currentLocation.latitude": 1,
  "currentLocation.longitude": 1,
});

const buddyModel =
  mongoose.models.Buddy ||
  mongoose.model("Buddy", buddySchema);

export default buddyModel;