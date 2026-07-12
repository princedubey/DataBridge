# DataBridge: Full-Stack Backend Assignment

DataBridge is a highly resilient, idempotent synchronization pipeline built with **NestJS**, **Prisma**, and **Supabase (PostgreSQL)**. It pulls records from three completely different data sources (HubSpot CRM, Stripe Payments, and Google Calendar) and normalizes them into a canonical schema.

## Features & Problem Statement Solutions

### Problem 1: Robust Sync Pipeline
- **Incremental & Full Fetching**: The `SyncService` gracefully orchestrates data fetching using cursors saved in a `SyncState` Postgres table. 
- **Error Handling & Fallbacks**: If a cursor is rejected (e.g. expired or a 410 error), the `SyncService` captures the exception and automatically falls back to a **Full Backfill**, guaranteeing no data is permanently skipped.
- **Idempotency**: All writes route through the `IdempotencyService`, which utilizes Prisma's `upsert` capabilities based on external IDs. The exact same data can be run through the pipeline 1,000 times without duplicating rows.
- **Isolated Failures**: The master orchestrator (`POST /sync/trigger-all`) executes integrations utilizing `Promise.allSettled`. If the HubSpot API throws a 401 Unauthorized, the orchestrator catches it, logs the exact error to a `SyncLog` table, and continues processing Stripe and Google Calendar undisturbed. The entire run never wedges.

### Problem 2: Metrics & Revenue Unification (No drifts)
- **Canonical Statuses**: Strict canonical mapping is implemented within the `StripeNormalizer`, categorizing different underlying statuses into exactly one concept: `COLLECTED`. This uses an explicit **allow-list**, ensuring unknown/new statuses don't leak into revenue.
- **Single Source of Truth**: The `RevenueService` exposes two endpoints (`/metrics/revenue` and `/metrics/revenue/daily`), but both rely on a single internal validation function `parseDateFilter()` and a strict query of the `Payment` table for `status: 'COLLECTED'`. The day-by-day breakdown and the summary total will **never drift** because they execute exactly the same underlying logic.
- **Future Proofing**: Because normalization happens *at the boundary* (in the normalizer module), the internal schema remains clean. If a developer adds a new source system, it *must* implement the `Normalizer` interface, forcing them to explicitly map statuses.

---

## 🛠️ Tradeoffs Made

1. **NestJS vs Express/Fastify**: I chose NestJS because its dependency injection and modularity make it incredibly easy to enforce interfaces (`IntegrationProvider`, `Normalizer`). While heavier than a raw Express app, it prevents spaghetti code when dealing with multiple 3rd party APIs.
2. **PostgreSQL Upserts vs Soft-Deletes**: I used Postgres `upsert` (via Prisma) for idempotency instead of complex soft-delete or append-only event logs. Upserts are slightly heavier on database locks, but they perfectly guarantee idempotency (no duplicate rows) with minimal codebase complexity.
3. **Promise.allSettled vs Message Queue**: To handle isolated failures, I used Node's native `Promise.allSettled` to run the 3 syncs concurrently. A more robust enterprise approach would be a message queue (RabbitMQ/BullMQ), but that would overcomplicate this assignment's infrastructure. Node's event loop handles this gracefully for our scale.

---

## 🚀 How to Run Locally

### 1. Requirements
- Node.js v18+
- Supabase (or any PostgreSQL) database.

### 2. Setup
1. Clone the repository
2. Run `npm install`
3. Copy `.env.example` to `.env` and fill in the required values:
   - `DATABASE_URL` / `DIRECT_URL`: Connection strings to your Postgres instance.
   - `STRIPE_SECRET_KEY`: Stripe API secret key.
   - `HUBSPOT_ACCESS_TOKEN`: HubSpot Private App / Service Key token.
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REFRESH_TOKEN`: Google OAuth credentials.

### 3. Database Initialization
1. Push the schema to your database: `npx prisma db push`
2. Generate the Prisma Client: `npx prisma generate`

### 4. Running the App
1. Build the app: `npm run build`
2. Start the server: `npm run start` (Wait for it to say `Nest application successfully started`)

### 5. The UI Dashboard
I built a lightweight UI so you can easily test these endpoints without needing Postman!
Open your browser and navigate to **[http://localhost:3000](http://localhost:3000)**.
From there you can:
1. Trigger the master sync pipeline.
2. Fetch the canonical total revenue.
3. Fetch the daily revenue breakdown.

---

## Documentation
For deeper dives into the project's design and constraints, please review the following documents:
- **[Requirements & Specifications](./docs/REQUIREMENT.md)**: The original project specifications and constraints.
- **[Architecture & Design Patterns](./docs/ARCHITECTURE.md)**: Includes data-flow Mermaid diagrams and an explanation of the core architectural decisions (Dependency Injection, Anti-Corruption Layers).

## �📚 Sources & References
*   [NestJS Documentation](https://docs.nestjs.com/)
*   [Prisma Documentation (Upsert, Aggregations)](https://www.prisma.io/docs)
*   [Stripe API Reference (Test Data Seeding)](https://stripe.com/docs/api)
*   [HubSpot API Reference (OAuth & Private Apps)](https://developers.hubspot.com/docs/api/overview)
*   [Google Calendar API Reference](https://developers.google.com/calendar/api/v3/reference)

## 🤖 AI Usage
This project was built with the assistance of an AI coding agent. The AI was directed to scaffold the NestJS architecture, implement the robust pipeline logic to handle edge cases (like 401s and cursor fallbacks), build the frontend dashboard, and debug deployment configuration for Render (e.g., overriding memory limits).
*(Please find the exported chat history linked alongside this repo submission!)*