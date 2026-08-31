# HeadsUp

**HeadsUp** is an Android-first intelligent topic tracking application that helps users follow the things they care about without constantly searching for updates themselves.

Users describe what they want to follow in natural language, optionally mark terms that must appear in matching content, and HeadsUp discovers relevant updates, analyzes them, builds a personalized feed, and decides when a notification is actually worth sending.

> A public web demo is available separately from the personal production environment.  
> The demo runs entirely with browser-local data and never connects to the production API, database, AI provider, or notification infrastructure.

## Live Demo

**Web Demo:** Coming soon

The public demo is intentionally isolated from the production backend and stores its state only in the visitor's browser.

---

## Features

- Natural-language topic tracking
- Required-term matching for precise searches
- Google News RSS discovery
- Open Library integration for book-related tracking
- AI-assisted watch interpretation and article analysis
- Deterministic local fallbacks when AI is unavailable
- Relevance and importance scoring
- Personalized discovery feed
- Category and topic filtering
- Read/unread tracking
- Archive pagination
- Configurable notification policies
- Manual watch scans
- Expo push notifications
- Isolated browser-based public demo

## How it works

```text
User Watch
    ↓
Watch Interpretation
    ↓
Search Planning
    ↓
Discovery Sources
    ├── Google News RSS
    └── Open Library
    ↓
Required-Term Filtering
    ↓
Article Analysis
    ↓
Persistence
    ↓
Feed
    ↓
Notification Policy
    ↓
Expo Push
```

Feed relevance and notification delivery are deliberately separated.

A relevant article can therefore appear in the feed without necessarily interrupting the user with a push notification.

---

## Architecture

HeadsUp uses a modular monolith for the backend with a separate worker process for background jobs.

```text
Expo Client
     │
     │ REST + JWT
     ▼
NestJS API
     │
     ├──────────── PostgreSQL / Prisma
     │
     ▼
Redis / BullMQ
     │
     ▼
Worker
 ├── Discovery Sources
 ├── Gemini / Local AI
 └── Expo Push
```

The codebase separates responsibilities around:

- Watch management
- AI providers and analysis
- Discovery sources
- Article persistence
- Pipeline orchestration
- Notification policy
- Client data access

This keeps external providers and infrastructure concerns outside the core application flow.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for more detail.

---

## Tech Stack

### Mobile / Web

- React Native
- Expo
- TypeScript
- React Native Web

### Backend

- NestJS
- TypeScript
- PostgreSQL
- Prisma
- Redis
- BullMQ

### AI & Discovery

- Gemini 2.5 Flash-Lite
- Google News RSS
- Open Library
- Local deterministic AI fallbacks

### Infrastructure

- Vercel
- Cloudflare Workers
- Expo Push Notifications

---

## Repository Structure

```text
apps/
├── api/        NestJS API and worker
└── mobile/     Expo Android and web client

infra/          Scheduler and deployment helpers
docs/           Architecture and deployment documentation
scripts/        Repository and development utilities
```

---

## Public Demo

The public demo uses the same application interface while replacing the production data layer with an isolated browser implementation.

```text
Public Web Demo
      ↓
Demo API Client
      ↓
Browser LocalStorage
```

It does **not** connect to:

- the personal production API
- PostgreSQL / Neon
- Redis
- Gemini
- Expo Push
- production authentication

Each visitor receives an independent browser-local demo state.

Run it locally with:

```bash
npm run demo:web
```

Create a static production export with:

```bash
npm run demo:export
```

See [`docs/DEMO.md`](docs/DEMO.md) for deployment details.

---

## Local Development

### Install dependencies

```bash
npm install
```

### Prepare Prisma

```bash
npm run prisma:generate
npm run prisma:migrate
```

### Start the API

```bash
npm run dev:api
```

### Start the Expo client

In another terminal:

```bash
npm run dev:mobile
```

Environment templates are available at:

```text
apps/api/.env.example
apps/mobile/.env.example
```

Real credentials and local `.env` files must never be committed.

---

## Quality Checks

Format check:

```bash
npm run format:check
```

Tests:

```bash
npm test
```

Public repository security audit:

```bash
npm run public:audit
```

---

## Screenshots

> Screenshots and a short product demo will be added with the public deployment.

---

## Project Status

HeadsUp is actively developed as a personal software engineering project focused on:

- event-driven background processing
- external data-source integration
- AI-assisted content analysis
- notification decision systems
- clean service boundaries
- React Native / NestJS full-stack architecture

The public web version is designed as a safe product showcase rather than a shared production account.