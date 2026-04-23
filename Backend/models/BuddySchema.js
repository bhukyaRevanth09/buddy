import mongoose from "mongoose";

const buddySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, default: "buddy" },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other", "Prefer not to say"], // Fixed typo "Perfer"
    default: "Prefer not to say"
  },
  category: { type: String, required: true, index: true }, // Added index for faster matching
  
  // Storing as Strings is fine since your test proved it works, 
  // but ensure you index them for array searching performance.
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

  // GeoJSON Pattern
  geoLocation: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },

  accountStatus: {
    type: String,
    enum: ["active", "suspended", "blocked", "pending"],
    default: 'pending',
    index: true // Highly recommended for filtering online buddies
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
  },
}, { timestamps: true });

// COMPOUND INDEX: Essential for the "Nearest Active Buddy" query
buddySchema.index({ geoLocation: "2dsphere" });
buddySchema.index({ accountStatus: 1, isOnline: 1, category: 1 });

const buddyModel = mongoose.models.Buddy || mongoose.model("Buddy", buddySchema);
export default buddyModel;