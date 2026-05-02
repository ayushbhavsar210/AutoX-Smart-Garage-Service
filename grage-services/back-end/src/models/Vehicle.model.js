import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    brand: {
      type: String,
      required: true
    },
    model: {
      type: String,
      required: true
    },
    vehicleNumber: {
      type: String,
      required: true,
      unique: true
    },
    type: {
      type: String,
      enum: ["car", "bike"],
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Vehicle", vehicleSchema);