import express from "express";
import auth from "../middleware/auth.middleware.js";
import admin from "../middleware/admin.middleware.js";
import { createService, getServices } from "../controllers/service.controller.js";

const r = express.Router();
r.get("/", getServices);
r.post("/", auth, admin, createService);
export default r;