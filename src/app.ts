import express from "express";
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

export default app;
