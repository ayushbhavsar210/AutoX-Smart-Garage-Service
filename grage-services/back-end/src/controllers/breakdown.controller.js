import Breakdown from "../models/Breakdown.model.js";

/**
 * USER → CREATE BREAKDOWN
 */
export const createBreakdown = async (req, res) => {
  try {
    const { vehicleId, location, issue } = req.body;

    // ✅ validations
    if (!vehicleId || !location || !issue) {
      return res.status(400).json({
        message: "vehicleId, location and issue are required"
      });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const breakdown = await Breakdown.create({
      user: req.user.id,
      vehicle: vehicleId,
      location,
      issue
    });

    res.status(201).json({
      message: "Breakdown request created",
      breakdown
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * ADMIN → GET ALL BREAKDOWNS
 */
export const getAllBreakdowns = async (req, res) => {
  try {
    const breakdowns = await Breakdown.find()
      .populate("user", "name email")
      .populate("vehicle");

    res.json(breakdowns);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * ADMIN → UPDATE BREAKDOWN STATUS
 */
export const updateBreakdownStatus = async (req, res) => {
  try {
    const breakdown = await Breakdown.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    if (!breakdown) {
      return res.status(404).json({ message: "Breakdown not found" });
    }

    res.json({
      message: "Status updated",
      breakdown
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};