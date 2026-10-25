import { describe, expect, it } from "vitest";

import { monitorBatchSchema, monitorInputSchema } from "../src/schemas/monitor.schema";

describe("Monitoring Input Validation", () => {
  const validRecord = {
    api_name: "PatientDataAPI",
    response_time_ms: 1200,
    status_code: 200,
    records_returned: 50,
  };

  it("accepts a valid single observation", () => {
    expect(monitorInputSchema.safeParse(validRecord).success).toBe(true);
  });

  it("accepts a valid batch", () => {
    expect(monitorBatchSchema.safeParse([validRecord, { ...validRecord, api_name: "AppointmentAPI" }]).success).toBe(true);
  });

  it("rejects negative response time", () => {
    expect(monitorInputSchema.safeParse({ ...validRecord, response_time_ms: -100 }).success).toBe(false);
  });

  it("rejects invalid status codes", () => {
    expect(monitorInputSchema.safeParse({ ...validRecord, status_code: 999 }).success).toBe(false);
  });

  it("rejects unexpected fields", () => {
    expect(monitorInputSchema.safeParse({ ...validRecord, secret: "hidden" }).success).toBe(false);
  });

  it("rejects empty batches", () => {
    expect(monitorBatchSchema.safeParse([]).success).toBe(false);
  });
});
