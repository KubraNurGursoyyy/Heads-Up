# HeadsUp

HeadsUp is an Android-first topic tracking app. A user describes what they want to follow in natural language, optionally marks terms that must appear in matching content, and HeadsUp discovers relevant updates, scores them, builds a feed, and decides when a push notification is worth sending.

## What it does

- Creates natural-language watches with optional required terms.
- Discovers matching news through Google News RSS and book metadata through Open Library.
- Uses Gemini for structured watch/article analysis with deterministic local fallbacks.
- Separates feed relevance from notification policy so relevant items can be saved without notifying on every match.
- Supports categories, feed filters, archive pagination, manual scans and Expo push notifications.
- Includes an isolated public web demo that never connects to the personal production backend.

## Tech stack

- React Native + Expo + TypeScript
- NestJS + TypeScript
- PostgreSQL + Prisma
- Redis + BullMQ
- Gemini 2.5 Flash-Lite
- Google News RSS + Open Library
- Cloudflare Workers
- Expo Push Notifications

## Repository shape

```text
apps/
  api/       NestJS API + worker
  mobile/    Expo Android/Web client
infra/       scheduler/deployment helpers
docs/        architecture and deployment notes
scripts/     repository utilities
```

The backend is a modular monolith with explicit service boundaries for AI, discovery, watch management and pipeline orchestration. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Local setup

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev:api
```

Run the Expo client in a second terminal:

```bash
npm run dev:mobile
```

Environment templates live in `apps/api/.env.example` and `apps/mobile/.env.example`. Real credentials and local `.env` files must not be committed.

## Public web demo

The demo uses seeded browser-local data instead of the real API, database, AI provider or push infrastructure.

```bash
npm run demo:web
```

A static demo export can be checked with:

```bash
npm run demo:export
```

For deployment details and the required `EXPO_PUBLIC_DEMO_MODE=true` setting, see [`docs/DEMO.md`](docs/DEMO.md).

## Checks

```bash
npm run format:check
npm run test
npm run public:audit
```
