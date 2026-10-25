import type { Request, Response } from "express";
import { monitorInputSchema } from "../schemas/monitor.schema";
import { processMonitoringRecords } from "../services/monitor.service";

export async function monitorController(
  req: Request,
  res: Response
): Promise<void> {
  const result = monitorInputSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      success: false,
      message: "Invalid monitoring input",
      errors: result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  const records = Array.isArray(result.data)
    ? result.data
    : [result.data];

  const summary = await processMonitoringRecords(records);
  const anomaliesDetected = summary.results.reduce(
    (total, detection) => total + detection.anomalies.length,
    0,
  );

  res.status(200).json({
    success: true,
    message: "Monitoring data processed successfully",
    total_received: records.length,
    observations_saved: summary.observationsSaved,
    anomalies_detected: anomaliesDetected,
    alerts_processed: summary.alertsProcessed,
    ai_generated: summary.aiGenerated,
    fallback_generated: summary.fallbackGenerated,
    data: summary.results,
  });
}
