import type { Request, Response } from "express";

import {
  getNotificationSettings,
  notificationSettingsSchema,
  updateNotificationSettings,
} from "../config/notification.config";

export function getNotificationSettingsController(
  _req: Request,
  res: Response,
): void {
  res.status(200).json({
    success: true,
    settings: getNotificationSettings(),
  });
}

export function updateNotificationSettingsController(
  req: Request,
  res: Response,
): void {
  const parsed = notificationSettingsSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Invalid notification settings",
      errors: parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: "Notification settings updated",
    settings: updateNotificationSettings(parsed.data),
  });
}
