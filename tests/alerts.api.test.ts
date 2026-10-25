import { describe, expect, it, vi } from "vitest";
import request from "supertest";

const mocks = vi.hoisted(() => ({ getAlerts: vi.fn() }));

vi.mock("../src/repositories/alert-query.repository", () => ({
  getAlerts: mocks.getAlerts,
}));

import app from "../src/app";

describe("GET /alerts", () => {
  it("returns active alerts", async () => {
    mocks.getAlerts.mockResolvedValueOnce({
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
      alerts: [],
    });

    const response = await request(app).get("/alerts");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.alerts).toEqual([]);
    expect(mocks.getAlerts).toHaveBeenCalledWith(
      expect.objectContaining({ status: "ACTIVE", page: 1, limit: 10 }),
    );
  });

  it("rejects invalid severity and pagination", async () => {
    expect((await request(app).get("/alerts?severity=INVALID")).status).toBe(400);
    expect((await request(app).get("/alerts?limit=500")).status).toBe(400);
  });

  it("returns HTTP 500 on repository failure", async () => {
    mocks.getAlerts.mockRejectedValueOnce(new Error("Simulated database failure"));

    const response = await request(app).get("/alerts");

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });

  it("supports pagination parameters", async () => {
    mocks.getAlerts.mockResolvedValueOnce({ total: 0, page: 2, limit: 5, totalPages: 0, alerts: [] });

    const response = await request(app).get("/alerts?page=2&limit=5&sort=asc");

    expect(response.status).toBe(200);
    expect(mocks.getAlerts).toHaveBeenCalledWith(expect.objectContaining({ page: 2, limit: 5, sort: "asc" }));
  });
});
