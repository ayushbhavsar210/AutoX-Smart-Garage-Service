import express from "express";
import { getAllParts, createPart } from "../controllers/part.controller.js";

const router = express.Router();

// ADMIN PARTS API
router.get("/", getAllParts);
router.post("/", createPart);

export default router;