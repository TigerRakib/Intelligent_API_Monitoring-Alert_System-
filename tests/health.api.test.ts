import { describe, expect, it } from "vitest";
import request from "supertest";

import app from "../src/app";

describe("HTTP health and fallback handling", () => {
  it("returns HTTP 200 with health JSON", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.body).toEqual({ status: "ok", service: "intelligent-api-monitoring" });
  });

  it("returns 404 for an unknown endpoint", async () => {
    const response = await request(app).get("/unknown-route");

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it("returns 400 for malformed JSON", async () => {
    const response = await request(app)
      .post("/monitor")
      .set("Content-Type", "application/json")
      .send('{"api_name":');

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid JSON request body");
  });
});
