import { z } from "zod";

export const notificationSettingsSchema = z.strictObject({
  enabled: z.boolean(),
  min_severity: z.enum(["CRITICAL", "WARNING"]),
});

export type NotificationSettings = z.infer<typeof notificationSettingsSchema>;

let settings: NotificationSettings = {
  enabled: process.env.ALERT_EMAIL_ENABLED === "true",
  min_severity: process.env.ALERT_EMAIL_MIN_SEVERITY === "WARNING"
    ? "WARNING"
    : "CRITICAL",
};

export function getNotificationSettings(): NotificationSettings {
  return { ...settings };
}

export function updateNotificationSettings(
  nextSettings: NotificationSettings,
): NotificationSettings {
  settings = { ...nextSettings };
  return getNotificationSettings();
}
