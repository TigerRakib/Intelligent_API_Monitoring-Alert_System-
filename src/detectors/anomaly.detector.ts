import type { MonitorRecord } from "../schemas/monitor.schema";
import {
  getApiConfig,
  type ApiMonitoringConfig,
} from "../config/anomaly.config";

export type AnomalyType =
  | "HIGH_LATENCY"
  | "CRITICAL_LATENCY"
  | "HTTP_CLIENT_ERROR"
  | "HTTP_SERVER_ERROR"
  | "EMPTY_RESPONSE";

export type Severity = "WARNING" | "CRITICAL";

export interface Anomaly {
  type: AnomalyType;
  severity: Severity;
  message: string;
}

export interface DetectionResult {
  api_name: string;
  status: "NORMAL" | "ANOMALY";
  overall_severity: Severity | null;
  anomalies: Anomaly[];
  observed_at: string;
}

export function detectAnomalies(
  record: MonitorRecord,
  config: ApiMonitoringConfig = getApiConfig(record.api_name),
): DetectionResult {
  const anomalies: Anomaly[] = [];

  if (record.response_time_ms > config.criticalLatencyMs) {
    anomalies.push({
      type: "CRITICAL_LATENCY",
      severity: "CRITICAL",
      message: `${record.api_name} response time exceeded ${config.criticalLatencyMs} ms.`,
    });
  } else if (record.response_time_ms > config.warningLatencyMs) {
    anomalies.push({
      type: "HIGH_LATENCY",
      severity: "WARNING",
      message: `${record.api_name} response time exceeded ${config.warningLatencyMs} ms.`,
    });
  }

  if (record.status_code >= 500 && record.status_code <= 599) {
    anomalies.push({
      type: "HTTP_SERVER_ERROR",
      severity: "CRITICAL",
      message: `${record.api_name} returned HTTP ${record.status_code}.`,
    });
  } else if (record.status_code >= 400 && record.status_code <= 499) {
    anomalies.push({
      type: "HTTP_CLIENT_ERROR",
      severity: "WARNING",
      message: `${record.api_name} returned HTTP ${record.status_code}.`,
    });
  }

  if (config.expectRecords && record.records_returned === 0) {
    anomalies.push({
      type: "EMPTY_RESPONSE",
      severity: "WARNING",
      message: `${record.api_name} returned zero records.`,
    });
  }

  const overallSeverity: Severity | null = anomalies.some(
    (anomaly) => anomaly.severity === "CRITICAL",
  )
    ? "CRITICAL"
    : anomalies.length > 0
      ? "WARNING"
      : null;

  return {
    api_name: record.api_name,
    status: anomalies.length > 0 ? "ANOMALY" : "NORMAL",
    overall_severity: overallSeverity,
    anomalies,
    observed_at: new Date().toISOString(),
  };
}

export function detectBatchAnomalies(
  records: MonitorRecord[],
): DetectionResult[] {
  return records.map((record) => detectAnomalies(record));
}
