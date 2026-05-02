import express from "express";
import cors from "cors";

import auth from "./routes/auth.routes.js";
import vehicles from "./routes/vehicle.routes.js";
import services from "./routes/service.routes.js";
import mods from "./routes/modification.routes.js";
import bookings from "./routes/booking.routes.js";
import admin from "./routes/admin.routes.js";
import breakdownRoutes from "./routes/breakdown.routes.js";
import partRoutes from "./routes/part.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", auth);
app.use("/api/vehicles", vehicles);
app.use("/api/services", services);
app.use("/api/modifications", mods);
app.use("/api/bookings", bookings);
app.use("/api/admin", admin); // 🔥 IMPORTANT
app.use("/api/breakdowns", breakdownRoutes);
app.use("/api/parts", partRoutes);

app.use((req, res) => {
  console.log("❌ ROUTE HIT:", req.method, req.originalUrl);
  res.status(404).json({ message: "Route not found" });
});

export default app;