import { describe, expect, it } from "vitest";

import { detectAnomalies } from "../src/detectors/anomaly.detector";
import type { MonitorRecord } from "../src/schemas/monitor.schema";

const createRecord = (overrides: Partial<MonitorRecord> = {}): MonitorRecord => ({
  api_name: "PatientDataAPI",
  response_time_ms: 100,
  status_code: 200,
  records_returned: 20,
  ...overrides,
});

describe("Anomaly Detection Engine", () => {
  it("identifies a healthy API response", () => {
    const result = detectAnomalies(createRecord());

    expect(result.status).toBe("NORMAL");
    expect(result.anomalies).toHaveLength(0);
    expect(result.overall_severity).toBeNull();
  });

  it("detects high response time", () => {
    const result = detectAnomalies(createRecord({ response_time_ms: 3000 }));

    expect(result.anomalies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "HIGH_LATENCY", severity: "WARNING" }),
      ]),
    );
  });

  it("detects critical latency without high-latency duplication", () => {
    const result = detectAnomalies(createRecord({ response_time_ms: 6000 }));

    expect(result.anomalies.some((anomaly) => anomaly.type === "CRITICAL_LATENCY")).toBe(true);
    expect(result.anomalies.some((anomaly) => anomaly.type === "HIGH_LATENCY")).toBe(false);
    expect(result.overall_severity).toBe("CRITICAL");
  });

  it("detects HTTP 500", () => {
    const result = detectAnomalies(createRecord({ status_code: 500 }));

    expect(result.anomalies[0].type).toBe("HTTP_SERVER_ERROR");
    expect(result.overall_severity).toBe("CRITICAL");
  });

  it("detects unexpected empty responses", () => {
    const result = detectAnomalies(createRecord({ records_returned: 0 }));

    expect(result.anomalies.some((anomaly) => anomaly.type === "EMPTY_RESPONSE")).toBe(true);
  });

  it("detects multiple anomalies together", () => {
    const result = detectAnomalies(
      createRecord({ response_time_ms: 6000, status_code: 500, records_returned: 0 }),
    );

    expect(result.anomalies).toHaveLength(3);
    expect(result.status).toBe("ANOMALY");
    expect(result.overall_severity).toBe("CRITICAL");
  });
});
