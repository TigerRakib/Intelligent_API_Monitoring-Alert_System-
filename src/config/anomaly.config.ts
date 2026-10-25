export interface ApiMonitoringConfig {
  warningLatencyMs: number;
  criticalLatencyMs: number;
  expectRecords: boolean;
}

export const defaultMonitoringConfig: ApiMonitoringConfig = {
  warningLatencyMs: 2000,
  criticalLatencyMs: 5000,
  expectRecords: true,
};

// Keep this map sparse: add entries only for APIs that differ from the defaults.
export const apiMonitoringConfigs: Record<string, ApiMonitoringConfig> = {
  AppointmentAPI: {
    warningLatencyMs: 2500,
    criticalLatencyMs: 5000,
    expectRecords: true,
  },
  BillingAPI: {
    warningLatencyMs: 3000,
    criticalLatencyMs: 6000,
    expectRecords: false,
  },
};

export function getApiConfig(apiName: string): ApiMonitoringConfig {
  return apiMonitoringConfigs[apiName] ?? defaultMonitoringConfig;
}
