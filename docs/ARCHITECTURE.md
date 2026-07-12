# DataBridge Architecture

This document provides a comprehensive overview of the architecture, design patterns, and data flow of the DataBridge sync pipeline and metrics service.

## 1. System Overview

DataBridge is a highly modular, decoupled backend application built using **NestJS** and **Prisma ORM**, backed by a **Supabase (PostgreSQL)** database. 

The architecture is divided into two primary subsystems:
1. **The Sync Pipeline**: A robust, idempotent ETL (Extract, Transform, Load) engine that pulls from disparate 3rd-party APIs, normalizes the shapes, and writes to a canonical database.
2. **The Metrics Service**: A unified querying layer that enforces a strict allow-list logic to calculate financial metrics that mathematically cannot drift between different views.

---

## 2. Architecture Diagram (Data Flow)

The following diagram illustrates how data flows from external integrations, through the synchronization orchestrator, into the database, and ultimately out through the canonical metrics service.

```mermaid
graph TD
    subgraph External Data Sources
        HS[HubSpot API<br/>CRM Data]
        ST[Stripe API<br/>Payments Data]
        GC[Google Calendar API<br/>Events Data]
    end

    subgraph DataBridge Backend (NestJS)
        subgraph 1. Integration Layer
            HSC[HubSpot Connector]
            STC[Stripe Connector]
            GCC[GCal Connector]
        end
        
        subgraph 2. Normalization Layer
            HSN[HubSpot Normalizer]
            STN[Stripe Normalizer]
            GCN[GCal Normalizer]
        end
        
        subgraph 3. Orchestration Layer
            SS[SyncService<br/>Cursor & Error State]
            IS[IdempotencyService<br/>Prisma Upserts]
        end
        
        subgraph 4. Metrics Layer
            RS[RevenueService<br/>Strict Allow-List]
            RC[RevenueController<br/>API Endpoints]
        end
    end

    subgraph Supabase PostgreSQL
        DB[(Canonical Database<br/>Customers, Payments, Events)]
    end

    %% Flow of Sync Data
    HS -. Incremental Fetch .-> HSC
    ST -. Incremental Fetch .-> STC
    GC -. Incremental Fetch .-> GCC

    HSC --> HSN
    STC --> STN
    GCC --> GCN

    HSN --> SS
    STN --> SS
    GCN --> SS

    SS --> IS
    IS -- Idempotent DB Write --> DB

    %% Flow of Metrics Data
    DB --> RS
    RS --> RC
```

---

## 3. Core Architectural Concepts

### Dependency Injection & Interfaces
The architecture heavily leverages TypeScript interfaces to enforce boundaries.
*   `IntegrationProvider<T>`: Every API connector must implement this interface, requiring a `fetchData(cursor)` method. This abstracts away the underlying HTTP libraries (`axios`, `stripe-node`, `hubspot-api-client`).
*   `Normalizer<ExternalType, InternalType>`: Forces incoming data into the canonical Prisma database schema. This acts as an anti-corruption layer, protecting our database from upstream API changes.

### Idempotent Database Writes
The pipeline is designed so that a webhook triggering the sync 1,000 times will not create duplicate data. The `IdempotencyService` utilizes Prisma's `upsert` functionality mapped to the unique external ID of the record (e.g., the Stripe Charge ID). 

### Graceful Orchestration (Failure Isolation)
In `AppService.triggerAllSyncs()`, the orchestrator fires all connectors simultaneously using `Promise.allSettled`. 
*   If HubSpot returns a `401 Unauthorized` or throws an error, the `SyncService` catches it internally.
*   It updates the `SyncState` table to `FAILED` and writes to the `SyncLog`.
*   The orchestrator continues processing Stripe and Google Calendar without crashing.

### Anti-Drift Metrics (Single Source of Truth)
To solve Problem 2, the `RevenueService` acts as the exclusive gatekeeper for the concept of "Collected Revenue".
*   The `StripeNormalizer` forces raw Stripe statuses into our internal taxonomy (e.g., `COLLECTED`, `PENDING`, `FAILED`).
*   The `RevenueService` queries the database with a strict allow-list (`status: 'COLLECTED'`).
*   Both the Total Summary API and the Daily Breakdown API utilize the exact same underlying validation and querying functions. If a new status is added, both endpoints immediately inherit it, completely preventing drift.
