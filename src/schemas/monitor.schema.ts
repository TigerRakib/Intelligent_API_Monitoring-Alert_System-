import { z } from "zod";

export const monitorRecordSchema = z.strictObject({
  api_name: z.string().trim().min(1),
  response_time_ms: z.number().finite().nonnegative(),
  status_code: z.number().int().min(100).max(599),
  records_returned: z.number().int().nonnegative(),
});

export const monitorBatchSchema = z.array(monitorRecordSchema).min(1).max(100);

// Backward-compatible alias for the single-record controller flow.
export const monitorInputSchema = z.union([
  monitorRecordSchema,
  monitorBatchSchema,
]);

export type MonitorRecord = z.infer<typeof monitorRecordSchema>;
