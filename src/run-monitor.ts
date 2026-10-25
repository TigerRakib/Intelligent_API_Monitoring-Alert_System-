import "dotenv/config";

import { processMonitoringInput } from "./services/monitor.service";

processMonitoringInput().catch(() => {
  process.exitCode = 1;
});
