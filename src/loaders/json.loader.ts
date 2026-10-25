import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  monitorBatchSchema,
  type MonitorRecord,
} from "../schemas/monitor.schema";

export async function loadApiResponses(
  filePath = "data/api_responses.json",
): Promise<MonitorRecord[]> {
  const absolutePath = resolve(process.cwd(), filePath);
  const fileContents = await readFile(absolutePath, "utf-8");
  const parsedData: unknown = JSON.parse(fileContents);

  return monitorBatchSchema.parse(parsedData);
}
