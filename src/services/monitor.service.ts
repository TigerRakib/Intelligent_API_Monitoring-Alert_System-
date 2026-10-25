import { loadApiResponses } from "../loaders/json.loader";

export async function processMonitoringInput(): Promise<void> {
  try {
    const records = await loadApiResponses();

    console.log("Monitoring data loaded successfully.");
    console.log(`Total API observations: ${records.length}`);
    console.table(records);
  } catch (error) {
    console.error("Failed to process monitoring data:", error);
    throw error;
  }
}
