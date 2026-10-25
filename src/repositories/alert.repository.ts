import type { AlertGenerationResult } from "../ai/alert.generator";
import { prisma } from "../lib/prisma";

export async function saveAIExplanation(
  eventId: number,
  generated: AlertGenerationResult,
): Promise<void> {
  await prisma.alert.updateMany({
    where: { eventId },
    data: {
      aiTitle: generated.alert.title,
      aiExplanation: generated.alert.explanation,
      aiRecommendation: generated.alert.recommendation,
      aiStatus: generated.source === "AI" ? "COMPLETED" : "FALLBACK",
    },
  });
}
