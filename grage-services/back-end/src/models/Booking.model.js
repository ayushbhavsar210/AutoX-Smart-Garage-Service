import mongoose from "mongoose";

export default mongoose.model(
  "Booking",
  new mongoose.Schema(
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      service: {
        serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
        name: String,
        price: Number
      },
      vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },
      schedule: {
        date: Date,
        timeSlot: String
      },
      paymentMethod: String,
      status: {
        type: String,
        enum: ["pending", "confirmed", "completed", "cancelled"],
        default: "pending"
      }
    },
    { timestamps: true }
  )
);