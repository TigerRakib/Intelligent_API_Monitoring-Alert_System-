import "dotenv/config";

import { disconnectPrisma } from "./lib/prisma";
import { processMonitoringInput } from "./services/monitor.service";

processMonitoringInput()
  .catch((error: unknown) => {
    console.error("Monitoring failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectPrisma();
  });
