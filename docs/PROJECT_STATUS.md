# Project status

## Validation

The repository includes the mobile app, API, worker, database schema, initial migration, Docker services, and setup documentation.

The following static checks were completed on the source package:

- Required project structure is present.
- JSON configuration files parse successfully.
- Relative TypeScript import targets resolve to local files.
- TypeScript/TSX source files have no parser-level syntax diagnostics.
- Prisma schema and the included initial SQL migration are aligned.

## First local run

Run the normal dependency installation and build checks after cloning:

```bash
npm install
npm run prisma:generate
docker compose up -d
npm run prisma:migrate
npm run build:api
npm --workspace @headsup/mobile run check
```

Then start the API, worker, and mobile app as described in the root `README.md`.


## Free-tier runtime

- OpenAI integration is not present.
- Brave Search integration is not present.
- Gemini is optional and defaults to `gemini-2.5-flash-lite`.
- Google News RSS is the default keyless discovery source.
- If Gemini is unavailable or rate-limited, local fallback analysis keeps the pipeline running.
