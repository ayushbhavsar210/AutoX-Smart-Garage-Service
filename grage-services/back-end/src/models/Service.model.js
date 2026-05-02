import mongoose from "mongoose";

export default mongoose.model(
  "Service",
  new mongoose.Schema(
    {
      name: String,
      price: Number,
      duration: Number,
      description: String
    },
    { timestamps: true }
  )
);