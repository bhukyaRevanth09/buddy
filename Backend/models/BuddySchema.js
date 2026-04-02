import mongoose from "mongoose";

const buddySchema = new mongoose.Schema({

  name: { type: String,
     required: true,
      trim: true },

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
    required: true,
    select: false
  },

  role: {
    type: String,
    default: "buddy"
  },

  category: {
    type: String,
    required: true
  },

  skills: [{ type: String, index: true }],

  experience: {
    type: Number,
    default: 0
  },

  pricePerHour: {
    type: Number,
    required: true
  },

  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },

  geoLocation: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },

  liveLocation: {
    lat: Number,
    lng: Number,
    updatedAt: Date
  },

  verificationStatus: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending"
  },

  accountStatus: {
    type: String,
    enum: ["active", "suspended", "blocked"],
    default: "active"
  },

  availabilityStatus: {
    type: String,
    enum: ["available", "busy", "offline"],
    default: "offline",
    index: true
  },

  isOnline: {
    type: Boolean,
    default: false
  },

  socketId: String,
  fcmToken: String,

  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },

  totalBooking: {
    type: Number,
    default: 0
  },

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
  },

  documents: [
    {
      name: String,
      url: String
    }
  ]

}, { timestamps: true });

buddySchema.index({ geoLocation: "2dsphere" });
buddySchema.index({ availabilityStatus: 1, verificationStatus: 1 });

export default mongoose.model("Buddy", buddySchema);