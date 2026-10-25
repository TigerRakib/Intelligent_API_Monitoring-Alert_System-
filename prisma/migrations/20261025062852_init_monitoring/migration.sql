-- CreateTable
CREATE TABLE "ApiService" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "MonitoringEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "apiServiceId" INTEGER NOT NULL,
    "responseTimeMs" REAL NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "recordsReturned" INTEGER NOT NULL,
    "observedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MonitoringEvent_apiServiceId_fkey" FOREIGN KEY ("apiServiceId") REFERENCES "ApiService" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "eventId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "message" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Alert_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "MonitoringEvent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiService_name_key" ON "ApiService"("name");

-- CreateIndex
CREATE INDEX "MonitoringEvent_apiServiceId_observedAt_idx" ON "MonitoringEvent"("apiServiceId", "observedAt");

-- CreateIndex
CREATE INDEX "Alert_eventId_createdAt_idx" ON "Alert"("eventId", "createdAt");
