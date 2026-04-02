import mongoose from "mongoose";

const instantBookingSchema = new mongoose.Schema({

  // 👤 USER DETAILS
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },

  // 🧑‍🔧 BUDDY (AUTO / MANUAL ASSIGN)
  buddy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Buddy",
    default: null, // null until assigned
    index: true
  },

  // 🔁 AUTO ASSIGN FLAG
  isAutoAssigned: {
    type: Boolean,
    default: true
  },

  // 🛠 SERVICE INFO
  serviceType: {
    type: String,
    required: true,
    index: true
  },

  serviceDetails: {
    description: String,
    images: [String]
  },

  // 💰 PRICING STRUCTURE (IMPORTANT)
  pricing: {
    basePrice: Number,
    platformFee: Number,
    taxes: Number,
    totalAmount: {
      type: Number,
      required: true
    }
  },

  // 📍 LOCATION (WITH GEO INDEX)
  location: {
    address: String,
    coordinates: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true
      }
    }
  },

  // 📌 BOOKING STATUS FLOW
  status: {
    type: String,
    enum: [
      "searching",   // finding buddy
      "assigned",    // buddy assigned
      "accepted",    
      "rejected",
      "on-the-way",
      "arrived",
      "in-progress",
      "completed",
      "cancelled",
      "expired"
    ],
    default: "searching",
    index: true
  },

  //  OTP FOR SECURITY
otp: {
  start: {
    code: {
      type: String,
      select: false 
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
      select: false
    },
    expiresAt: Date,
    attempts: {
      type: Number,
      default: 0
    }
  }
},

  //  TIMELINE TRACKING
  acceptedAt: Date,
  startedAt: Date,
  arrivedAt: Date,
  completedAt: Date,
  cancelledAt: Date,

  // ❌ CANCELLATION DETAILS
  cancellation: {
    cancelledBy: {
      type: String,
      enum: ["user", "buddy", "system"]
    },
    reason: String
  },

  // 💳 PAYMENT SYSTEM
  payment: {
    method: {
      type: String,
      enum: ["cash", "online", "wallet"]
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending"
    },
    transactionId: String
  },

  // ⭐ RATINGS
  rating: {
    givenByUser: {
      rating: Number,
      review: String
    },
    givenByBuddy: {
      rating: Number,
      review: String
    }
  },

  // 🔄 REAL-TIME TRACKING
  liveTracking: {
    buddyLocation: {
      lat: Number,
      lng: Number
    },
    lastUpdated: Date
  },

  // 🧾 AUDIT LOG (VERY IMPORTANT INDUSTRY LEVEL)
  logs: [
    {
      status: String,
      changedAt: Date,
      note: String
    }
  ]

}, { timestamps: true });


// 📍 GEO INDEX FOR NEARBY SEARCH
instantBookingSchema.index({ "location.coordinates": "2dsphere" });

const InstantBooking = mongoose.model("InstantBooking", instantBookingSchema);

export default InstantBooking;