# Free-tier operating rules

HeadsUp is designed to run without a paid AI or paid news-search API in its initial configuration.

## Gemini

- Default model: `gemini-2.5-flash-lite`.
- Create the key in Google AI Studio from a project with billing disabled/not linked.
- Keep that project on the Gemini Free tier.
- Do not enable or link billing for the project used by HeadsUp if zero AI spend is required.
- When Gemini is missing, unavailable, or rate-limited, HeadsUp uses local deterministic fallback analysis.
- On HTTP 429, the worker pauses Gemini use for 10 minutes and continues with local analysis.

Important: Gemini billing tier is an account/project setting controlled by Google. The API request itself has no "free-only" switch. If billing is deliberately enabled on the Google project, code cannot guarantee zero cost.

## News discovery

The initial runtime uses Google News RSS and does not require a paid news/search API key. No Brave Search dependency is present.

## Push notifications

Expo push is used for Android notifications. Provider free-tier/usage policies can change independently of this repository.

## Hosting

Local development is free. Production hosting has not been locked to a provider yet. Before deployment, choose a provider whose current free tier fits the required API, worker, PostgreSQL, and Redis workload, or adapt the architecture to the provider's free limits.

## In-app free-tier policy alerts

HeadsUp itself checks the official Gemini API pricing page and Expo push-notification FAQ once per hour by default. The first successful check creates a baseline and sends no alert. If pricing/free-tier-related content later changes, the HeadsUp backend sends a push notification to registered devices. Configure with `POLICY_MONITOR_ENABLED` and `POLICY_MONITOR_MINUTES`. This is an early-warning mechanism; always verify the provider's official page before enabling billing.
