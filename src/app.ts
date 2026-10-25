import express from "express";

import { errorHandler } from "./middleware/error.middleware";
import alertRoutes from "./routes/alert.routes";
import monitorRoutes from "./routes/monitor.routes";

const app = express();

app.use(express.json({ limit: "100kb" }));

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "intelligent-api-monitoring",
  });
});

app.use(monitorRoutes);
app.use(alertRoutes);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
  });
});

app.use(errorHandler);

export default app;
