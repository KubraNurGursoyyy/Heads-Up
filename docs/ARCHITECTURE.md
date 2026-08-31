# Architecture

## Runtime shape

HeadsUp uses a modular NestJS API and a separate worker process. HTTP request handling stays small while discovery, analysis and notification work can run outside the request lifecycle.

```text
Android (Expo/React Native)
        |
        | REST + JWT
        v
NestJS API ------------------ PostgreSQL
        |                         ^
        | enqueue                 |
        v                         |
Redis / BullMQ ---> Worker -------+
                     |  |  |
                     |  |  +--> Expo Push Service
                     |  +-----> Gemini API
                     +--------> Discovery sources
```

## Public demo boundary

The public web demo never connects to the personal backend.

```text
Expo Web UI
    |
    v
ApiClient
   / \
  /   \
RemoteApiClient   DemoApiClient
     |                  |
 real API          localStorage
```

`EXPO_PUBLIC_DEMO_MODE=true` selects `DemoApiClient`. The same screens therefore keep the same UI and request-shaped interaction while demo data remains isolated inside each visitor's browser.

## Domain records

- `User`: account identity.
- `RefreshToken`: hashed refresh sessions.
- `Device`: Expo push token per device.
- `Watch`: natural-language tracking request and structured matching metadata.
- `Article`: unique discovered source item.
- `WatchArticle`: analysis of an article for one watch.
- `Notification`: push decision and delivery status.

## AI responsibilities

AI integration is split by responsibility:

- `WatchUnderstandingService` creates watch suggestions and deterministic quick-watch metadata.
- `ArticleAnalyzerService` evaluates discovered articles.
- `StructuredAiClient` is the provider boundary.
- `GeminiClientService` contains only Gemini transport, structured JSON generation and temporary rate-limit cooldown behavior.
- `local-ai.ts` contains deterministic fallbacks and has no network dependency.

This keeps product logic independent from one AI provider and makes the provider replaceable without changing watch or pipeline services.

## Discovery responsibilities

`SourcesService` is an orchestrator. Source-specific behavior lives behind focused services:

- `GoogleNewsSourceService`: Google News RSS requests and parsing.
- `OpenLibrarySourceService`: Open Library catalog requests.
- `ArticleDeduplicatorService`: URL cleanup, title normalization, ordering and result limiting.

Adding another discovery source does not require moving persistence or pipeline rules into the source layer.

## Pipeline responsibilities

`PipelineService` describes the use-case flow: load an active watch, discover candidates, enforce required terms, analyze, persist the match, decide whether to notify, and mark the watch as checked.

Persistence is handled by `PipelineRepository`. Notification rules and event-key normalization are handled by `NotificationPolicyService`. The orchestrator therefore reads as application flow instead of mixing SQL/Prisma details with business policy.

## Watch responsibilities

`WatchesService` coordinates watch use cases. `WatchesRepository` owns Prisma access and `WatchUniquenessService` owns duplicate-watch rules. Watch parsing is delegated to `WatchUnderstandingService`.

## Notification policy

All relevant articles are persisted in `WatchArticle`; push is a separate decision:

- `IMPORTANT_ONLY`: new information at or above the configured importance threshold.
- `ALL_RELEVANT`: every newly attached relevant article.
- `SELECTED_EVENTS`: new information matching configured event types.
- `OFF`: never push.

Normalized `eventKey` values suppress duplicate notifications for the same real-world development while keeping relevant articles available in the feed.
