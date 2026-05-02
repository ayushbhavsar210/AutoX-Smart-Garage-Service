import Modification from "../models/Modification.model.js";

/* ======================
   CREATE MODIFICATION (ADMIN)
====================== */
export const createModification = async (req, res) => {
  try {
    const modification = await Modification.create(req.body);
    res.status(201).json(modification);
  } catch (err) {
    res.status(500).json({ message: "Failed to create modification" });
  }
};

/* ======================
   GET ALL MODIFICATIONS (PUBLIC)
====================== */
export const getAllModifications = async (req, res) => {
  try {
    const modifications = await Modification.find();
    res.json(modifications);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch modifications" });
  }
};

/* ======================
   GET SINGLE MODIFICATION (PUBLIC)
====================== */
export const getModificationById = async (req, res) => {
  try {
    const modification = await Modification.findById(req.params.id);

    if (!modification) {
      return res.status(404).json({ message: "Modification not found" });
    }

    res.json(modification);
  } catch (err) {
    res.status(400).json({ message: "Invalid modification ID" });
  }
};

/* ======================
   UPDATE MODIFICATION (ADMIN)
====================== */
export const updateModification = async (req, res) => {
  try {
    const updated = await Modification.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updated);
  } catch {
    res.status(500).json({ message: "Update failed" });
  }
};

/* ======================
   DELETE MODIFICATION (ADMIN)
====================== */
export const deleteModification = async (req, res) => {
  try {
    await Modification.findByIdAndDelete(req.params.id);
    res.json({ message: "Modification deleted successfully" });
  } catch {
    res.status(500).json({ message: "Delete failed" });
  }
};