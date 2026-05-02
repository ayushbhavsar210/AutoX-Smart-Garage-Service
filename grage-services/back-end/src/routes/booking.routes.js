import express from "express";
import auth from "../middleware/auth.middleware.js";
import admin from "../middleware/admin.middleware.js";
import {
  createBooking,
  myBookings,
  allBookings
} from "../controllers/booking.controller.js";

const r = express.Router();
r.post("/", auth, createBooking);
r.get("/my", auth, myBookings);
r.get("/", auth, admin, allBookings);
export default r;