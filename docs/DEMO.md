# Public Demo

HeadsUp web demo is intentionally isolated from the personal production backend.

## How it works

When `EXPO_PUBLIC_DEMO_MODE=true` is set for the Expo web build, the mobile app switches its data client from the real REST API to an in-browser demo client.

```text
Expo Web UI
    |
    v
ApiClient
    |
    v
DemoApiClient ---> browser localStorage
```

The demo does not call the NestJS API, Neon/PostgreSQL, Gemini, Redis, Cloudflare cron, or Expo Push. Each visitor gets an independent local state in their own browser.

The existing screens still exercise the same actions: list/create/edit/delete watches, run a simulated scan, filter the feed, mark an item as read, browse the archive, and change local settings.

## Local preview

From the repository root:

```text
npm run demo:web
```

To verify a static web export in demo mode:

```text
npm run demo:export
```

Both commands explicitly clear the real API URL and single-user key for that child process.

## Deploy a public web demo

Set this environment variable in the web deployment:

```text
EXPO_PUBLIC_DEMO_MODE=true
```

Do not define `EXPO_PUBLIC_HEADSUP_SINGLE_USER_KEY` or a personal `EXPO_PUBLIC_API_URL` in the public demo deployment. They are not needed in demo mode.

For a personal/native build, keep:

```text
EXPO_PUBLIC_DEMO_MODE=false
```

and configure the real API URL and single-user key through local/EAS environment variables.

## Reset behavior

The `PUBLIC DEMO` banner includes a reset action. It clears only the demo key in browser `localStorage` and reloads the seeded demo data.
