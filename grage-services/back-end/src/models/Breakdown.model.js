import mongoose from "mongoose";

const breakdownSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true
    },
    location: {
      type: String,
      required: true
    },
    issue: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "assigned", "completed", "cancelled"],
      default: "pending"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Breakdown", breakdownSchema);