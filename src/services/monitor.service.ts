import { loadApiResponses } from "../loaders/json.loader";
import {
  detectBatchAnomalies,
  type DetectionResult,
} from "../detectors/anomaly.detector";
import { saveMonitoringBatch } from "../repositories/monitoring.repository";

export async function processMonitoringInput(): Promise<DetectionResult[]> {
  const records = await loadApiResponses();
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

  for (const result of results) {
    console.log(`\nAPI: ${result.api_name}`);
    console.log(`Status: ${result.status}`);

    if (result.anomalies.length === 0) {
      console.log("No anomalies detected.");
      continue;
    }

    for (const anomaly of result.anomalies) {
      console.log(`[${anomaly.severity}] ${anomaly.type}: ${anomaly.message}`);
    }
  }

  return results;
}
