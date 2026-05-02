import express from "express";
import auth from "../middleware/auth.middleware.js";
import admin from "../middleware/admin.middleware.js";

import {
  createBreakdown,
  getAllBreakdowns,
  updateBreakdownStatus
} from "../controllers/breakdown.controller.js";

const router = express.Router();

/* USER */
router.post("/", auth, createBreakdown);

/* ADMIN */
router.get("/", auth, admin, getAllBreakdowns);
router.put("/:id/status", auth, admin, updateBreakdownStatus);

export default router;