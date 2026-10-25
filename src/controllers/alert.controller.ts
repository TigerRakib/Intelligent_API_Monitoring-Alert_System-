import type { NextFunction, Request, Response } from "express";

import { getAlerts } from "../repositories/alert-query.repository";
import { alertQuerySchema } from "../schemas/alert-query.schema";

export async function getAlertsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parsed = alertQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Invalid alert query parameters",
      errors: parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  try {
    const result = await getAlerts(parsed.data);
    const alerts = result.alerts.map((alert) => ({
      id: alert.id,
      api_name: alert.event.apiService.name,
      anomaly_type: alert.type,
      severity: alert.severity,
      status: alert.status,
      message: alert.message,
      ai_title: alert.aiTitle,
      ai_explanation: alert.aiExplanation,
      ai_recommendation: alert.aiRecommendation,
      ai_status: alert.aiStatus,
      response_time_ms: alert.event.responseTimeMs,
      status_code: alert.event.statusCode,
      records_returned: alert.event.recordsReturned,
      created_at: alert.createdAt,
    }));

    res.status(200).json({
      success: true,
      total: result.total,
      pagination: {
        page: result.page,
        limit: result.limit,
        total_pages: result.totalPages,
      },
      alerts,
    });
  } catch (error) {
    next(error);
  }
}
