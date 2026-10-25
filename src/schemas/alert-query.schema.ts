import { z } from "zod";

export const alertQuerySchema = z.strictObject({
  severity: z.enum(["WARNING", "CRITICAL"]).optional(),
  status: z.enum(["ACTIVE", "ACKNOWLEDGED", "RESOLVED", "ALL"]).default("ACTIVE"),
  api_name: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sort: z.enum(["asc", "desc"]).default("desc"),
});

export type AlertQuery = z.infer<typeof alertQuerySchema>;
