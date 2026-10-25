import "dotenv/config";

import OpenAI from "openai";
import { z } from "zod";

import type { DetectionResult } from "../detectors/anomaly.detector";
import type { MonitorRecord } from "../schemas/monitor.schema";

const aiAlertSchema = z.object({
  title: z.string().trim().min(1),
  explanation: z.string().trim().min(1),
  recommendation: z.string().trim().min(1),
});

export type GeneratedAlert = z.infer<typeof aiAlertSchema>;

export interface AlertGenerationResult {
  alert: GeneratedAlert;
  source: "AI" | "FALLBACK";
}

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 8000,
      maxRetries: 0,
    })
  : null;

function createFallbackAlert(
  record: MonitorRecord,
  detection: DetectionResult,
): GeneratedAlert {
  return {
    title: `${record.api_name}: ${detection.overall_severity ?? "WARNING"} alert`,
    explanation: detection.anomalies
      .map((anomaly) => anomaly.message)
      .join(" "),
    recommendation:
      "Review the API response, provider availability, and recent application logs.",
  };
}

export async function generateAIAlert(
  record: MonitorRecord,
  detection: DetectionResult,
): Promise<AlertGenerationResult> {
  if (detection.anomalies.length === 0) {
    throw new Error("AI alert generation requires detected anomalies.");
  }

  const fallback = (): AlertGenerationResult => ({
    alert: createFallbackAlert(record, detection),
    source: "FALLBACK",
  });

  if (!client) {
    console.warn("OpenAI API key unavailable; using fallback.");
    return fallback();
  }

  try {
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      instructions:
        "You are a technical API monitoring assistant. Generate a concise alert from the supplied monitoring metadata and detected anomalies. Do not change severity, invent facts, or include sensitive data. Describe possible causes as possibilities and recommend practical investigation steps. Return only JSON with title, explanation, and recommendation.",
      input: JSON.stringify({
        api_name: record.api_name,
        response_time_ms: record.response_time_ms,
        status_code: record.status_code,
        records_returned: record.records_returned,
        severity: detection.overall_severity,
        anomalies: detection.anomalies,
      }),
      text: {
        format: {
          type: "json_schema",
          name: "api_alert",
          strict: true,
          schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              explanation: { type: "string" },
              recommendation: { type: "string" },
            },
            required: ["title", "explanation", "recommendation"],
            additionalProperties: false,
          },
        },
      },
    });

    return {
      alert: aiAlertSchema.parse(JSON.parse(response.output_text) as unknown),
      source: "AI",
    };
  } catch (error) {
    console.error(
      "AI generation failed; using fallback:",
      error instanceof Error ? error.message : error,
    );
    return fallback();
  }
}
