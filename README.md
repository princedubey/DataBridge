# DataBridge

DataBridge is a highly resilient, idempotent synchronization pipeline built with **NestJS**, **Prisma**, and **Supabase (PostgreSQL)**. It pulls records from three completely different data sources (HubSpot CRM, Stripe Payments, and Google Calendar) and normalizes them into a canonical schema.

## Features & Problem Statement Solutions

### 1. Robust Sync Pipeline (No missing or duplicated data)
- **Incremental & Full Fetching**: The `SyncService` gracefully orchestrates the logic using cursors saved in a `SyncState` Postgres table. 
- **Error Handling & Fallbacks**: If a cursor is rejected (e.g. expired or a 410 error), the `SyncService` captures the exception and automatically falls back to a **Full Backfill**, guaranteeing no data is permanently skipped.
- **Idempotency**: All writes route through the `IdempotencyService`, which utilizes Prisma's `upsert` capabilities. The exact same data can be run through the pipeline 1,000 times without duplicating rows.
- **Isolated Failures**: The master orchestrator (`POST /sync/trigger-all`) executes integrations utilizing `Promise.allSettled`. If the Google API goes down or returns garbage, HubSpot and Stripe syncs will continue undisturbed.

### 2. Metrics & Revenue Unification (No drifts)
- **Canonical Statuses**: We implemented strict canonical mapping within the `StripeNormalizer`, categorizing different underlying statuses into exactly one concept: `COLLECTED`.
- **Single Source of Truth**: The `RevenueService` exposes two endpoints (`/metrics/revenue` and `/metrics/revenue/daily`), but both rely on a single internal validation function `parseDateFilter()` and a strict query of the `Payment` table for `status: 'COLLECTED'`. 
- **Future Proofing**: Because normalization happens *at the boundary* (in the normalizer), the internal schema remains clean. If a new source system is added, it *must* implement the `Normalizer` interface, forcing developers to map their custom statuses to our internal taxonomy, catching drift at compile time.

## How to Run Locally

### 1. Requirements
- Node.js v18+
- Supabase (or any PostgreSQL) database.

### 2. Setup
1. Clone the repository: `git clone ...`
2. Run `npm install`
3. Copy `.env.example` to `.env` and fill in the required values:
   - `DATABASE_URL`: Connection string to your Postgres instance.
   - `STRIPE_SECRET_KEY`: Stripe API secret key.
   - `HUBSPOT_ACCESS_TOKEN`: HubSpot Private App / Service Key token.
   - `GOOGLE_CLIENT_ID`: Google OAuth client ID.
   - `GOOGLE_CLIENT_SECRET`: Google OAuth client secret.
   - `GOOGLE_REFRESH_TOKEN`: Google OAuth refresh token.

### 3. Database Initialization
1. Push the schema to your database: `npx prisma db push`
2. Generate the Prisma Client: `npx prisma generate`

### 4. Running the App
1. Build the app: `npm run build`
2. Start the server: `npm run start`

### 5. Triggering Syncs & Viewing Metrics
- **Trigger All Syncs**: `curl -X POST http://localhost:3000/sync/trigger-all`
- **View Total Revenue**: `curl http://localhost:3000/metrics/revenue`
- **View Daily Revenue**: `curl "http://localhost:3000/metrics/revenue/daily?startDate=2023-01-01&endDate=2024-01-01"`

## Deployment

This project is configured to automatically deploy to Render using the included `render.yaml` blueprint.

## AI Usage & References
This assignment was completed heavily leveraging AI pair programming via Google DeepMind's specialized agentic models. 
*   **Documentation Used**: NestJS Docs, Prisma Docs, Stripe API Reference, HubSpot API Reference, Google API Reference.
