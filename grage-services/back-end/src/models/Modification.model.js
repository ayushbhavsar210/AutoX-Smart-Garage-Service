import mongoose from "mongoose";

export default mongoose.model(
  "Modification",
  new mongoose.Schema(
    {
      title: String,
      price: Number,
      description: String
    },
    { timestamps: true }
  )
);