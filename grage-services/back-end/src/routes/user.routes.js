import express from "express";
import User from "../models/User.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    console.log("❌ ROUTE HIT: GET /api/users");

    const users = await User.find();

    res.status(200).json(users); // 🔥 MAIN FIX
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;