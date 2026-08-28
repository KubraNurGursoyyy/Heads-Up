# Architecture

## Shape

HeadsUp is intentionally a modular monolith plus a separate worker process. This keeps deployment and debugging simple while keeping expensive/background work away from HTTP request handling.

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
                     |  +-----> Gemini API (free-tier project)
                     +--------> Google News RSS
```

## Main domain records

- `User`: identity and account settings.
- `RefreshToken`: hashed refresh sessions.
- `Device`: Expo push token per device.
- `Watch`: user's natural-language request + structured interpretation.
- `Article`: unique discovered source item.
- `WatchArticle`: relevance/importance analysis of an article for one watch.
- `Notification`: push decision + delivery status.

## Discovery

`SourcesService` currently uses keyless Google News RSS. More category-specific **free/keyless** adapters can be added without changing watch/article persistence. Paid search providers are intentionally not part of the default runtime.

## AI boundaries

AI does not run the scheduler. It has two bounded jobs:

1. `interpretWatch(prompt)`: convert natural language to structured watch metadata.
2. `analyzeArticle(watch, article)`: return relevance, importance, new-information flag, event type and short Turkish summary.

The service requests structured JSON from Gemini 2.5 Flash-Lite. Gemini is optional: a local parser/classifier keeps the product usable when no key is configured or the free-tier quota/rate limit is unavailable. A 429 response temporarily opens a local circuit breaker so repeated failed Gemini calls are avoided.

## Notification policy

All relevant articles are persisted in `WatchArticle`. Push is a separate decision. AI also emits a stable `eventKey`; reports of the same real-world event from multiple outlets stay in the feed but duplicate pushes are suppressed by the normalized event key:

- `IMPORTANT_ONLY`: score >= threshold and new information.
- `ALL_RELEVANT`: every newly attached relevant article.
- `SELECTED_EVENTS`: only matching `notifyEvents` and new information.
- `OFF`: never push.

This separation is deliberate: the user can read every relevant article without being interrupted by every article.
