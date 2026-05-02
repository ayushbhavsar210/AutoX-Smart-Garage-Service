import express from "express";
import {
  getAllUsers,
  getAllMechanics,
  getAllVehicles,
  getAllBookings,
  getAllServices
} from "../controllers/admin.controller.js";

const router = express.Router();

// ADMIN DATA GRID ROUTES
router.get("/users", getAllUsers);
router.get("/mechanics", getAllMechanics);
router.get("/vehicles", getAllVehicles);
router.get("/bookings", getAllBookings);
router.get("/parts", getAllServices); 

export default router;