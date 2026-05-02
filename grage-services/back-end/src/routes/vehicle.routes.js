import express from "express";
import auth from "../middleware/auth.middleware.js";
import { addVehicle, myVehicles } from "../controllers/vehicle.controller.js";

const r = express.Router();
r.post("/", auth, addVehicle);
r.get("/", auth, myVehicles);
export default r;