import User from "../models/User.model.js";
import Mechanic from "../models/Mechanic.model.js";
import Vehicle from "../models/Vehicle.model.js";
import Booking from "../models/Booking.model.js";
import Service from "../models/Part.model.js";

/**
 * ADMIN DATA GRID CONTROLLERS
 */

// USERS
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().lean();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// MECHANICS
export const getAllMechanics = async (req, res) => {
  try {
    const mechanics = await Mechanic.find().lean();
    res.status(200).json(mechanics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// VEHICLES
export const getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find().lean();
    res.status(200).json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// BOOKINGS
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().lean();
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ contains: error.message });
  }
};

// SERVICES / PARTS (use services as parts)
export const getAllServices = async (req, res) => {
  try {
    const services = await Service.find().lean();
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};