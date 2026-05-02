import Part from "../models/Part.model.js";

/**
 * GET ALL PARTS (Admin DataGrid)
 */
export const getAllParts = async (req, res) => {
  try {
    const parts = await Part.find().lean(); // ⚡ fast
    res.status(200).json(parts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * CREATE PART
 */
export const createPart = async (req, res) => {
  try {
    const { name, price, category, stock } = req.body;

    const part = await Part.create({
      name,
      price,
      category,
      stock,
    });

    res.status(201).json(part);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};