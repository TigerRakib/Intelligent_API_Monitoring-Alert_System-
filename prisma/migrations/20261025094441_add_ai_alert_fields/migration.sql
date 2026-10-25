-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Alert" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "eventId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "message" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aiTitle" TEXT,
    "aiExplanation" TEXT,
    "aiRecommendation" TEXT,
    "aiStatus" TEXT NOT NULL DEFAULT 'PENDING',
    CONSTRAINT "Alert_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "MonitoringEvent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Alert" ("createdAt", "eventId", "id", "message", "severity", "status", "type") SELECT "createdAt", "eventId", "id", "message", "severity", "status", "type" FROM "Alert";
DROP TABLE "Alert";
ALTER TABLE "new_Alert" RENAME TO "Alert";
CREATE INDEX "Alert_eventId_createdAt_idx" ON "Alert"("eventId", "createdAt");
CREATE INDEX "Alert_status_createdAt_idx" ON "Alert"("status", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
