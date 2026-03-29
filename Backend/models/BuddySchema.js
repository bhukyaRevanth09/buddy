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

  category :{
 type:String,
 required:true
  } ,
  
  skills: [
    {
      type: String
    }
  ],

  experience: {
    type: Number, 
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

  availability: [
    {
      day: String,          
      slots: [String]       
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


  availabilityStatus: {
    type: String,
    enum: ["available", "busy", "offline"],
    default: "available"
  },


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