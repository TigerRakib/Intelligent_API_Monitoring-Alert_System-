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
    console.error("[monitoring] Persistence input mismatch", {
      records: records.length,
      results: results.length,
    });
    throw new Error("Records and detection results must have the same length.");
  }

  console.info("[monitoring] Persisting monitoring batch", {
    observations: records.length,
  });

  try {
    const summary = await prisma.$transaction(async (transaction) => {
      let alertsSaved = 0;
      const eventIds: number[] = [];

      for (let index = 0; index < records.length; index += 1) {
        const record = records[index];
        const result = results[index];

        console.info("[monitoring] Processing observation", {
          index: index + 1,
          api_name: record.api_name,
          status: result.status,
          anomalies: result.anomalies.length,
        });

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

        console.info("[monitoring] Observation event saved", {
          event_id: event.id,
          api_name: record.api_name,
        });

        const alertData: Prisma.AlertCreateManyInput[] = result.anomalies.map(
          (anomaly) => ({
            eventId: event.id,
            type: anomaly.type,
            severity: anomaly.severity,
            message: anomaly.message,
          }),
        );

        for (const alert of alertData) {
          const existingAlert = await transaction.alert.findFirst({
            where: {
              status: "ACTIVE",
              type: alert.type,
              event: {
                apiServiceId: apiService.id,
              },
            },
            orderBy: { createdAt: "desc" },
          });

          if (existingAlert) {
            await transaction.alert.update({
              where: { id: existingAlert.id },
              data: {
                eventId: event.id,
                severity: alert.severity,
                message: alert.message,
                aiTitle: null,
                aiExplanation: null,
                aiRecommendation: null,
                aiStatus: "PENDING",
              },
            });
            console.info("[monitoring] Active alert deduplicated", {
              alert_id: existingAlert.id,
              api_name: record.api_name,
              anomaly_type: alert.type,
            });
          } else {
            const createdAlert = await transaction.alert.create({ data: alert });
            console.info("[monitoring] Alert created", {
              alert_id: createdAlert.id,
              api_name: record.api_name,
              anomaly_type: alert.type,
              severity: alert.severity,
            });
          }

          alertsSaved += 1;
        }
      }

      return {
        observationsSaved: records.length,
        alertsSaved,
        eventIds,
      };
    });

    console.info("[monitoring] Monitoring batch persisted", {
      observations_saved: summary.observationsSaved,
      alerts_processed: summary.alertsSaved,
      event_ids: summary.eventIds,
    });

    return summary;
  } catch (error) {
    console.error("[monitoring] Failed to persist monitoring batch", error);
    throw error;
  }
}
