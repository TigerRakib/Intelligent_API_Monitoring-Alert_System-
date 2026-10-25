import type { Prisma } from "@prisma/client";

import type { DetectionResult } from "../detectors/anomaly.detector";
import { prisma } from "../lib/prisma";
import type { MonitorRecord } from "../schemas/monitor.schema";

export interface PersistenceSummary {
  observationsSaved: number;
  alertsSaved: number;
  eventIds: number[];
}

export async function saveMonitoringBatch(
  records: MonitorRecord[],
  results: DetectionResult[],
): Promise<PersistenceSummary> {
  if (records.length !== results.length) {
    throw new Error("Records and detection results must have the same length.");
  }

  return prisma.$transaction(async (transaction) => {
    let alertsSaved = 0;
    const eventIds: number[] = [];

    for (let index = 0; index < records.length; index += 1) {
      const record = records[index];
      const result = results[index];

      const apiService = await transaction.apiService.upsert({
        where: { name: record.api_name },
        update: {},
        create: { name: record.api_name },
      });

      const event = await transaction.monitoringEvent.create({
        data: {
          apiServiceId: apiService.id,
          responseTimeMs: record.response_time_ms,
          statusCode: record.status_code,
          recordsReturned: record.records_returned,
          observedAt: new Date(result.observed_at),
        },
      });
      eventIds.push(event.id);

      const alertData: Prisma.AlertCreateManyInput[] = result.anomalies.map(
        (anomaly) => ({
          eventId: event.id,
          type: anomaly.type,
          severity: anomaly.severity,
          message: anomaly.message,
        }),
      );

      if (alertData.length > 0) {
        await transaction.alert.createMany({ data: alertData });
        alertsSaved += alertData.length;
      }
    }

    return {
      observationsSaved: records.length,
      alertsSaved,
      eventIds,
    };
  });
}
