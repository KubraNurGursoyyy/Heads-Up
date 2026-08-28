# HeadsUp scheduler

This tiny Cloudflare Worker only triggers the protected HeadsUp maintenance endpoints. It stores no user data and performs no AI work itself.

1. Replace `API_URL` in `wrangler.toml` with the Vercel API URL.
2. Run `npx wrangler login`.
3. Run `npx wrangler secret put HEADSUP_CRON_SECRET` and enter the same value configured in Vercel.
4. Run `npx wrangler deploy`.

Cron triggers:

- every 15 minutes: news/watch scan
- hourly: free-tier policy check
