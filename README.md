# Intelligent API Monitoring & Alert System

A modular Node.js, Express, and TypeScript backend that loads API observations from a static JSON file, validates them with Zod, and detects abnormal API behavior using configurable rules.

Repository: [Intelligent API Monitoring & Alert System](https://github.com/TigerRakib/Intelligent_API_Monitoring-Alert_System-)

## Current status

- TypeScript and Node.js project setup
- Express application with a health endpoint
- Static JSON input loading
- Zod validation for API observations
- Configurable anomaly detection
- API-specific threshold overrides
- Console monitoring report
- Prisma + SQLite persistence for observations and alerts
- Structured AI alert explanations with deterministic fallback

Optional email notifications are supported for newly created critical alerts. They are disabled by default and require SMTP configuration.

The React dashboard is available in [frontend/](./frontend/). It reads active alerts from the backend `/alerts` endpoint and supports severity, status, and API filters.

## Technology stack

- Node.js
- Express
- TypeScript
- Zod
- dotenv
- tsx for development execution
- Prisma 6
- SQLite
- OpenAI SDK
- Pino and pino-http
- Vitest and Supertest

## Logging

The application uses Pino for structured logs and pino-http for request logs. Development logs are formatted with pino-pretty; production logs are emitted as JSON. Sensitive headers and common credential fields are redacted. Monitoring persistence logs batch processing, event creation, alert creation, deduplication, completion, and failures without logging raw monitoring payloads.

## Database

The project uses Prisma with SQLite for local development and assignment delivery. SQLite stores data in the local `dev.db` file, so no separate database server is required.

The schema is defined in [prisma/schema.prisma](./prisma/schema.prisma) and contains:

- `ApiService`: monitored API definitions
- `MonitoringEvent`: validated API observations
- `Alert`: detected anomaly records

When `npm run monitor` runs, the validated observations and detection results are saved in one Prisma transaction. Each API is upserted into `ApiService`, each observation is inserted into `MonitoringEvent`, and each detected anomaly is inserted or deduplicated in `Alert`. An active alert is reused for the same API and anomaly type. If any write fails, the transaction rolls back.

After Prisma dependencies are installed, initialize the client and database with:

```bash
npm run prisma:generate
npm run prisma:migrate
```

To inspect the database visually:

```bash
npm run prisma:studio
```

For AI alert explanations, configure these optional values in `.env`:

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
```

Anomalies are persisted before AI generation. Normal observations do not call the LLM. If the key is missing, invalid, or the request times out, a deterministic fallback explanation is saved with `aiStatus` set to `FALLBACK`.

To enable critical-alert email notifications, copy the SMTP settings from [.env.example](./.env.example) into `.env` and set `ALERT_EMAIL_ENABLED=true`. Email delivery is best-effort: a mail provider failure is logged and does not undo the monitoring database transaction.

SQLite is appropriate for this assignment because it is simple to run locally and supports relational tables, migrations, and transactions. PostgreSQL would be a better choice for a high-concurrency, multi-instance production deployment.

## Testing

Run the automated suite and TypeScript validation:

```bash
npm test
npm run typecheck
```

The test suite covers anomaly detection, Zod input validation, health and 404 responses, malformed JSON handling, `/alerts` query validation and repository failures, and deterministic AI fallback behavior. HTTP tests use Supertest and mock the alert repository so they do not require a live SQLite connection.

## Project structure

```text
intelligent-api-monitoring/
├── data/
│   └── api_responses.json
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── run-monitor.ts
│   ├── config/
│   │   └── anomaly.config.ts
│   ├── detectors/
│   │   └── anomaly.detector.ts
│   ├── loaders/
│   │   └── json.loader.ts
│   ├── schemas/
│   │   └── monitor.schema.ts
│   └── services/
│       └── monitor.service.ts
├── .env
├── .env.example
├── package.json
└── tsconfig.json
```

## Installation

```bash
npm install
```

Create a `.env` file in the project root:

```env
PORT=3000
NODE_ENV=development
```

## Available commands

```bash
# Run the development HTTP server
npm run dev

# Validate TypeScript without producing files
npm run typecheck

# Compile TypeScript into dist/
npm run build

# Run the compiled server
npm start

# Load the JSON dataset and run anomaly detection
npm run monitor

# Run the React dashboard on http://localhost:5173
npm run frontend:dev

# Build the React dashboard for production
npm run frontend:build
```

Run the backend and frontend in separate terminals. The Vite development server proxies `/api/alerts` to the backend at `http://localhost:3000/alerts`.

## Input format

The current input file is [data/api_responses.json](./data/api_responses.json). It contains an array of observations:

```json
{
  "api_name": "PatientDataAPI",
  "response_time_ms": 1200,
  "status_code": 200,
  "records_returned": 50
}
```

Each record must contain:

- `api_name`: non-empty string
- `response_time_ms`: non-negative finite number
- `status_code`: integer from 100 to 599
- `records_returned`: non-negative integer

The loader parses the file and validates the complete input using [monitor.schema.ts](./src/schemas/monitor.schema.ts). Invalid input stops processing with a validation error.

## Anomaly detection

The detection engine is implemented in [anomaly.detector.ts](./src/detectors/anomaly.detector.ts).

It detects:

- `HIGH_LATENCY`: response time exceeds the warning threshold
- `CRITICAL_LATENCY`: response time exceeds the critical threshold
- `HTTP_CLIENT_ERROR`: HTTP status from 400 to 499
- `HTTP_SERVER_ERROR`: HTTP status from 500 to 599
- `EMPTY_RESPONSE`: zero records when the API is configured to expect records

Each observation produces a structured result with:

- API name
- `NORMAL` or `ANOMALY` status
- overall severity
- individual anomaly types and messages
- processing timestamp

An observation can have multiple anomalies. For example, a slow API returning HTTP 500 can produce both a latency anomaly and a server-error anomaly. Critical severity takes precedence over warning severity.

## Configuration strategy

Rules are defined in [anomaly.config.ts](./src/config/anomaly.config.ts).

The project uses global defaults and sparse API-specific overrides. APIs that do not appear in the override map automatically use the defaults.

```ts
export const defaultMonitoringConfig = {
  warningLatencyMs: 2000,
  criticalLatencyMs: 5000,
  expectRecords: true,
};
```

An individual API can override its thresholds:

```ts
AppointmentAPI: {
  warningLatencyMs: 2500,
  criticalLatencyMs: 7000,
  expectRecords: true,
}
```

This avoids maintaining a configuration entry for every API. For a production-scale system, overrides should be stored in PostgreSQL or a configuration service and cached by the application.

## Processing flow

```text
JSON file
  → JSON loader
  → Zod validation
  → anomaly detector
  → monitoring report
```

The loader and detector share the same monitoring service used by `POST /monitor`, so observations from the static JSON file and HTTP requests follow the same detection, persistence, deduplication, and AI explanation flow.

## Frontend JSON upload

Start the backend and React dashboard in separate terminals:

```bash
npm run dev
npm run frontend:dev
```

Open `http://localhost:5173`, select **Upload JSON**, and choose a JSON file containing either one observation or an array of 1 to 100 observations. The dashboard sends the data to `POST /monitor`, then refreshes the alert list.

Example upload file:

```json
[
  {
    "api_name": "PatientDataAPI",
    "response_time_ms": 1200,
    "status_code": 200,
    "records_returned": 50
  },
  {
    "api_name": "AppointmentAPI",
    "response_time_ms": 5500,
    "status_code": 500,
    "records_returned": 0
  }
]
```

## Scalability considerations

The current `readFile` implementation is appropriate for the small assignment dataset. It loads the complete JSON array into memory and validates it as one batch.

For millions of observations, use:

- NDJSON/JSONL input instead of one very large JSON array
- Streaming file reads
- Per-record validation
- Bounded batches and backpressure
- PostgreSQL bulk inserts
- Cached configuration lookups
- Historical p95/p99 latency baselines


