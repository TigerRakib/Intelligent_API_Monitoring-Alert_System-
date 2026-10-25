import { Request, Response } from "express";
import { monitorInputSchema } from "../schemas/monitor.schema";

export function monitorController(
  req: Request,
  res: Response
): void {
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

  res.status(200).json({
    success: true,
    message: "Monitoring data validated successfully",
    total_received: records.length,
    data: records,
  });
}
