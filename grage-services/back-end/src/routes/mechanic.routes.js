import express from "express";
import Mechanic from "../models/Mechanic.js";
import { getAll } from "../controllers/common.controller.js";

const router = express.Router();

router.get("/", getAll(Mechanic));

export default router;