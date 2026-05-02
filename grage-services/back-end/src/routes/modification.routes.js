import express from "express";
import auth from "../middleware/auth.middleware.js";
import admin from "../middleware/admin.middleware.js";

import {
  createModification,
  getAllModifications,
  getModificationById,
  updateModification,
  deleteModification
} from "../controllers/modification.controller.js";

const router = express.Router();

router.get("/", getAllModifications);
router.get("/:id", getModificationById);
router.post("/", auth, admin, createModification);
router.put("/:id", auth, admin, updateModification);
router.delete("/:id", auth, admin, deleteModification);

export default router;