import mongoose from "mongoose";

const mechanicSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    specialization: String,
    experience: Number
  },
  { timestamps: true }
);

export default mongoose.model("Mechanic", mechanicSchema);