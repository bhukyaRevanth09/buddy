import mongoose from "mongoose";

const instantBookingSchema = new mongoose.Schema(
{
  /*
  =========================
  USER & BUDDY
  =========================
  */
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
    index: true,
  },

  buddy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Buddy",
    default: null,
    index: true,
  },

  /*
  =========================
  SERVICE DETAILS
  =========================
  */
  category: {
    type: String,
    required: true,
    index: true,
  },

  serviceType: String,

  requestedSkills: [String],

  /*
  =========================
  PICKUP LOCATION (STATIC)
  =========================
  */
  location: {
    address: String,
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
  LIVE TRACKING (DYNAMIC)
  =========================
  */
  liveLocation: {
    latitude: Number,
    longitude: Number,
    heading: Number,
    speed: Number,
    updatedAt: Date
  },

  /*
  =========================
  STATUS FLOW
  =========================
  */
  status: {
    type: String,
    enum: [
      "searching",
      "accepted",
      "arrived",
      "started",
      "completed",
      "cancelled",
      "failed"
    ],
    default: "searching",
    index: true,
  },

  /*
  =========================
  TIMESTAMPS
  =========================
  */
  acceptedAt: Date,
  arrivedAt: Date,
  startedAt: Date,
  completedAt: Date,
  cancelledAt: Date,

  /*
  =========================
  OTP SYSTEM (FIXED)
  =========================
  */
  otp: {
    start: {
      code: {
        type: String,
        default: null
      },
      expiresAt: Date,
      attempts: {
        type: Number,
        default: 0
      }
    },
    complete: {
      code: {
        type: String,
        default: null
      },
      expiresAt: Date,
      attempts: {
        type: Number,
        default: 0
      }
    }
  }

},
{ timestamps: true }
);

/*
=========================
INDEXES
=========================
*/
instantBookingSchema.index({ location: "2dsphere" });

const instantBookingModel =
  mongoose.models.InstantBooking ||
  mongoose.model("InstantBooking", instantBookingSchema);

export default instantBookingModel;