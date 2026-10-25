import "dotenv/config";

import nodemailer from "nodemailer";

import type { AlertGenerationResult } from "../ai/alert.generator";
import type { DetectionResult } from "../detectors/anomaly.detector";
import type { MonitorRecord } from "../schemas/monitor.schema";
import { getNotificationSettings } from "../config/notification.config";
import { logger } from "../utils/logger";

type CriticalAlertEmail = {
  record: MonitorRecord;
  detection: DetectionResult;
  generated: AlertGenerationResult;
};

function isEmailConfigured(): boolean {
  return getNotificationSettings().enabled && Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD &&
      process.env.ALERT_EMAIL_FROM &&
      process.env.ALERT_EMAIL_TO,
  );
}

function getTransporter() {
  const port = Number(process.env.SMTP_PORT || 587);

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

export async function sendAlertEmail({
  record,
  detection,
  generated,
}: CriticalAlertEmail): Promise<boolean> {
  const settings = getNotificationSettings();
  const severityAllowed = settings.min_severity === "WARNING"
    || detection.overall_severity === "CRITICAL";

  if (!isEmailConfigured() || !severityAllowed) {
    return false;
  }

  const anomalySummary = detection.anomalies
    .map((anomaly) => `- [${anomaly.severity}] ${anomaly.type}: ${anomaly.message}`)
    .join("\n");

  try {
    await getTransporter().sendMail({
      from: process.env.ALERT_EMAIL_FROM,
      to: process.env.ALERT_EMAIL_TO,
      subject: `[CRITICAL] ${record.api_name} monitoring alert`,
      text: [
        `API: ${record.api_name}`,
        `Severity: ${detection.overall_severity}`,
        `Response time: ${record.response_time_ms} ms`,
        `HTTP status: ${record.status_code}`,
        `Records returned: ${record.records_returned}`,
        "",
        "Detected anomalies:",
        anomalySummary,
        "",
        `AI explanation: ${generated.alert.explanation}`,
        `Recommendation: ${generated.alert.recommendation}`,
      ].join("\n"),
    });

    logger.info({ api_name: record.api_name }, "Critical alert email sent");
    return true;
  } catch (error) {
    logger.error({ err: error, api_name: record.api_name }, "Critical alert email failed");
    return false;
  }
}
