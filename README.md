# HeadsUp

Android-first intelligent watch/news tracker. A user writes what they want to follow in normal language. The backend turns that into a structured watch, continuously discovers related news, stores all relevant items in the feed, and sends push notifications only according to the user's notification preference.

## What is implemented

- React Native + Expo Android app (Expo SDK 57, Android target/compile SDK 36)
- NestJS REST API
- PostgreSQL + Prisma
- Redis + BullMQ worker
- Register/login/refresh-token auth
- Natural-language watch creation
- Gemini 2.5 Flash-Lite structured analysis through the Gemini API (optional free-tier key; deterministic fallback exists)
- Real Google News RSS query provider (no key required)
- Deduplication by canonical URL + SHA-256 fingerprint
- Cross-source event deduplication for push notifications (`eventKey`, one push per normalized real-world event)
- Per-watch relevance / importance / new-information analysis
- Feed: all relevant news, with important/unread/category/watch filters
- Push modes: important-only, all relevant, selected events, off
- Expo push registration and server-side sending
- Watch list, feed, read state, watch enable/disable, notification preference update
- Docker Compose for PostgreSQL + Redis

## 1. Requirements

- Node.js 22.13+
- npm 10+
- Docker Desktop (recommended for PostgreSQL/Redis)
- Android Studio + Android SDK if you want a local native Android build
- An Expo/EAS account for real remote push notifications

> Remote push notifications on Android require a development/release build, not Expo Go.

## 2. Environment

Copy the root env file:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

At minimum, change `JWT_SECRET`. For AI interpretation and classification, set `GEMINI_API_KEY` from a Google AI Studio project **without billing enabled**. The default model is `gemini-2.5-flash-lite`. If the key is missing, the free-tier quota is exhausted, or Gemini returns a rate-limit error, HeadsUp continues with its local keyword/rule fallback. HeadsUp does not require a paid search API; news discovery uses keyless Google News RSS.

Create `apps/mobile/.env`:

```env
EXPO_PUBLIC_API_URL=http://YOUR_PC_LAN_IP:3000
EXPO_PUBLIC_EAS_PROJECT_ID=YOUR_EAS_PROJECT_ID
```

For a physical Android phone, `localhost` points to the phone, not your PC. Use your PC's LAN IP, for example `http://192.168.1.20:3000`.


## Free-only AI setup

HeadsUp is configured so paid AI/search services are not required. To keep Gemini at zero cost:

1. Create the Gemini API key in Google AI Studio.
2. Use a project that has **no billing account enabled/linked**.
3. Put only the API key in the server-side `.env` as `GEMINI_API_KEY`.
4. Do not enable a paid Gemini tier for that project.

When the free quota/rate limit is reached, Gemini returns an error instead of HeadsUp switching to another paid provider. HeadsUp then uses its local fallback. Google controls Gemini account billing state; there is no request parameter that can force an already-billed Google project to use only free-tier capacity.

See `docs/FREE_TIER.md` for the operating rules.

## 3. Start infrastructure

```bash
docker compose up -d
```

## 4. Install + database

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
```

If Expo reports a package compatibility warning after install, run:

```bash
cd apps/mobile
npx expo install --fix
cd ../..
```

## 5. Run backend and worker

Terminal 1:

```bash
npm run dev:api
```

Terminal 2:

```bash
npm run dev:worker
```

API health: `GET http://localhost:3000/health`

## 6. Run Android app

```bash
npm run dev:mobile
```

For ordinary UI/API testing you can use Expo Go, but **remote Android push requires a development build**:

```bash
cd apps/mobile
npx eas init
npx eas build --profile development --platform android
```

Install the generated development build on the phone, then run `npx expo start --dev-client`.

## 7. Production notes

Before public release:

1. For zero-required-cost production, deploy the API to Vercel Hobby and PostgreSQL to Neon Free.
2. Production serverless mode does not require Redis/BullMQ; an authenticated scheduled HTTP call runs the scanner directly. See `docs/PRODUCTION_FREE.md`.
3. Put secrets only on the server.
4. Configure EAS/FCM credentials.
5. Replace the temporary Android package identifier if desired.
6. Add the public privacy-policy/account-deletion web pages required for your launch plan, plus production rate limits. (In-app account deletion is already implemented.)
7. Run a closed test before Google Play production.

## Core behavior

1. User: `GTA 6 PC çıkış tarihi belli olduğunda takip et.`
2. Gemini free tier extracts topic/category/intent/aliases/search queries/event types when available; otherwise local rules are used.
3. Scheduler enqueues active watches at the configured interval.
4. Worker queries Google News RSS without a paid search API.
5. Articles are deduplicated.
6. Gemini free tier/local rules score relevance, importance and whether it contains genuinely new information.
7. Relevant articles always enter the in-app feed.
8. Push is sent only when the watch's notification policy allows it.

See `docs/ARCHITECTURE.md`, `docs/ANDROID_PUSH.md`, and `docs/PROJECT_STATUS.md`.
