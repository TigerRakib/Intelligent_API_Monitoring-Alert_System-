import { loadApiResponses } from "../loaders/json.loader";
import { generateAIAlert } from "../ai/alert.generator";
import {
  detectBatchAnomalies,
  type DetectionResult,
} from "../detectors/anomaly.detector";
import { saveMonitoringBatch } from "../repositories/monitoring.repository";
import { saveAIExplanation } from "../repositories/alert.repository";
import type { MonitorRecord } from "../schemas/monitor.schema";
import { sendAlertEmail } from "../notifications/email.notifier";
import { getNotificationSettings } from "../config/notification.config";

export interface MonitoringProcessingSummary {
  records: MonitorRecord[];
  results: DetectionResult[];
  observationsSaved: number;
  alertsProcessed: number;
  aiGenerated: number;
  fallbackGenerated: number;
}

export async function processMonitoringRecords(
  records: MonitorRecord[],
): Promise<MonitoringProcessingSummary> {
  const results = detectBatchAnomalies(records);
  const persistence = await saveMonitoringBatch(records, results);

  const anomalousResults = results.filter(
    (result) => result.status === "ANOMALY",
  );
  const normalResults = results.filter(
    (result) => result.status === "NORMAL",
  );

  console.log("\n===== API MONITORING REPORT =====");
  console.log("Total observations:", results.length);
  console.log("Normal observations:", normalResults.length);
  console.log("Anomalous observations:", anomalousResults.length);
  console.log(
    `Persisted ${persistence.observationsSaved} observations and ${persistence.alertsSaved} alerts.`,
  );

  let aiGenerated = 0;
  let fallbackGenerated = 0;

  for (const [index, result] of results.entries()) {
    console.log(`\nAPI: ${result.api_name}`);
    console.log(`Status: ${result.status}`);

    if (result.anomalies.length === 0) {
      console.log("No anomalies detected.");
      continue;
    }

    const generated = await generateAIAlert(records[index], result);
    await saveAIExplanation(persistence.eventIds[index], generated);

    const notificationSettings = getNotificationSettings();
    const hasNewEligibleAlert = result.anomalies.some(
      (anomaly) =>
        (notificationSettings.min_severity === "WARNING" ||
          anomaly.severity === "CRITICAL") &&
        persistence.createdAlerts.some(
          (createdAlert) =>
            createdAlert.eventId === persistence.eventIds[index] &&
            createdAlert.type === anomaly.type,
        ),
    );

    if (hasNewEligibleAlert) {
      await sendAlertEmail({
        record: records[index],
        detection: result,
        generated,
      });
    }

    if (generated.source === "AI") {
      aiGenerated += 1;
    } else {
      fallbackGenerated += 1;
    }

    console.log(`Source: ${generated.source}`);
    console.log(`Title: ${generated.alert.title}`);
    console.log(`Explanation: ${generated.alert.explanation}`);
    console.log(`Recommendation: ${generated.alert.recommendation}`);

    for (const anomaly of result.anomalies) {
      console.log(`[${anomaly.severity}] ${anomaly.type}: ${anomaly.message}`);
    }
  }

  console.log("\n===== AI SUMMARY =====");
  console.log("AI explanations:", aiGenerated);
  console.log("Fallback explanations:", fallbackGenerated);

  return {
    records,
    results,
    observationsSaved: persistence.observationsSaved,
    alertsProcessed: persistence.alertsSaved,
    aiGenerated,
    fallbackGenerated,
  };
}

export async function processMonitoringInput(): Promise<DetectionResult[]> {
  const records = await loadApiResponses();
  const summary = await processMonitoringRecords(records);

  return summary.results;
}
