import { describe, expect, it, vi } from "vitest";

import { detectAnomalies } from "../src/detectors/anomaly.detector";
import type { MonitorRecord } from "../src/schemas/monitor.schema";

describe("AI Alert Fallback", () => {
  it("uses the deterministic fallback when no API key exists", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.resetModules();

    try {
      const { generateAIAlert } = await import("../src/ai/alert.generator");
      const record: MonitorRecord = {
        api_name: "AppointmentAPI",
        response_time_ms: 5500,
        status_code: 500,
        records_returned: 0,
      };
      const result = await generateAIAlert(record, detectAnomalies(record));

      expect(result.source).toBe("FALLBACK");
      expect(result.alert.title.length).toBeGreaterThan(0);
      expect(result.alert.explanation.length).toBeGreaterThan(0);
    } finally {
      vi.unstubAllEnvs();
      vi.resetModules();
    }
  });
});
