import Vehicle from "../models/Vehicle.model.js";

export const addVehicle = async (req, res) =>
  res.json(await Vehicle.create({ userId: req.user._id, ...req.body }));

export const myVehicles = async (req, res) =>
  res.json(await Vehicle.find({ userId: req.user._id }));