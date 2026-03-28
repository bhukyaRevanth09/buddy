


import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking"
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    amount: Number,

    method: {
      type: String,
      enum: ["upi", "card", "netbanking", "wallet"]
    },

    transactionId: String,

    gatewayResponse: Object,

    status: {
      type: String,
      enum: ["initiated", "success", "failed", "refunded"],
      default: "initiated"
    }
  },
  { timestamps: true }
);

const paymentModel = mongoose.model("Payment", paymentSchema);

export default paymentModel