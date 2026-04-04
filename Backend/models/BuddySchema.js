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
  gender:{
    type:String,
    enum:["Male","Female","Other","Perfer not to say"],
    default:"Perfer not to say"
  },

  category: {
    type: String,
    required: true
  },

  skills: [{ type: String, index: true }],
  interests: [{ type: String, index: true }],

 education:{
  type:String
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
  accountStatus: {
    type: String,
    enum: ["active", "suspended", "blocked","pending"],
    default:'pending'
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


}, { timestamps: true });

buddySchema.index({ geoLocation: "2dsphere" });
buddySchema.index({ availabilityStatus: 1, verificationStatus: 1 });

const buddyModel =  mongoose.model("Buddy", buddySchema);
export default buddyModel