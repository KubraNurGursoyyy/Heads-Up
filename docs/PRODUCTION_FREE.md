# HeadsUp free production deployment

HeadsUp can run away from the developer PC with the following zero-required-cost topology:

- API: Vercel Hobby (personal/non-commercial usage only under Vercel's Hobby terms)
- PostgreSQL: Neon Free
- AI: Gemini free tier with billing disabled; local rule fallback on quota/error
- News discovery: Google News RSS
- Push: Expo Push
- Scheduler: Cloudflare Workers Free Cron Trigger calls the protected maintenance endpoints

## Production environment variables

Set these on Vercel for the API project:

- `DATABASE_URL` — Neon pooled PostgreSQL connection string
- `JWT_SECRET` — long random value
- `JWT_ACCESS_TTL=15m`
- `REFRESH_TOKEN_DAYS=30`
- `GEMINI_API_KEY` — optional free-tier key
- `GEMINI_MODEL=gemini-2.5-flash-lite`
- `SEARCH_COUNTRY=TR`
- `SEARCH_LANG=tr`
- `WATCH_SEARCH_RESULT_LIMIT=12`
- `AI_IMPORTANCE_THRESHOLD=0.72`
- `EXPO_PUSH_URL=https://exp.host/--/api/v2/push/send`
- `HEADSUP_SERVERLESS=1`
- `HEADSUP_CRON_SECRET` — a separate long random secret
- `POLICY_MONITOR_ENABLED=false`

Do not configure Redis on Vercel. In serverless mode the queue adapter executes a requested watch directly.

## Scheduled calls

Every 15 minutes:

`POST https://YOUR_API/internal/scan`

Every hour:

`POST https://YOUR_API/internal/policy-check`

Both calls must include:

`X-HeadsUp-Cron-Secret: <HEADSUP_CRON_SECRET>`

The endpoints reject requests without the secret.

## Mobile production URL

Set `apps/mobile/.env` to the deployed HTTPS API URL:

`EXPO_PUBLIC_API_URL=https://YOUR_API`

Never put `DATABASE_URL`, `GEMINI_API_KEY`, `JWT_SECRET`, or `HEADSUP_CRON_SECRET` in the mobile app or GitHub source.

## Cloudflare scheduler

The repository contains `infra/cloudflare-scheduler`. Cloudflare Workers Free currently supports cron triggers and this scheduler uses only two. It calls the Vercel API every 15 minutes for watch scans and hourly for free-tier policy checks.

Setup:

```bash
cd infra/cloudflare-scheduler
npx wrangler login
npx wrangler secret put HEADSUP_CRON_SECRET
npx wrangler deploy
```

Before deploying, replace the `API_URL` value in `wrangler.toml` with the Vercel production URL. The cron secret must match the Vercel `HEADSUP_CRON_SECRET` environment variable.
