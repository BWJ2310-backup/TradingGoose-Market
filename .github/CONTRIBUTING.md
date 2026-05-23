# Contributing to TradingGoose Market

TradingGoose Market is a standalone Next.js app for canonical market reference data. It includes an admin UI, public market API routes, a Drizzle database package, upload storage providers, and optional market API plugins.

## Project Map

```text
app/          Next.js pages and API routes
components/   Shared UI, table, upload, settings, and email components
lib/          Auth, DB helpers, email, market API, and UI utilities
packages/db/  Drizzle schema, client, and generated migrations
uploads/      Local, Vercel Blob, and Azure Blob storage abstraction
scripts/      Plugin install tooling
```

## Local Setup

```bash
cp .env.example .env
bun install
bun run db:migrate
bun run dev
```

Open `http://localhost:3000/admin`.

Required for a normal local setup:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `NEXT_PUBLIC_APP_URL`
- `INTERNAL_API_SECRET`
- `REDIS_URL`

## Validation

Run the checks that match your change. For most code changes:

```bash
git diff --check main...HEAD
bun run type-check
ESLINT_USE_FLAT_CONFIG=false npx eslint .
```

The current `lint` script uses `next lint`; if it fails before linting, document that and use the ESLint command above.

## Ground Rules

- Branch from `main` and open PRs against `main` unless a maintainer says otherwise.
- Keep changes focused and describe env, cache, auth, billing, storage, provider, and rollout impact.
- Use Conventional Commits, for example `fix(market-api): require Redis for response cache`.
- Do not manually edit files under any `*/migrations/` directory; generate Drizzle migrations when schema changes require them.
- Do not add legacy fallback paths when replacing behavior. Keep only the updated method.
- Do not commit secrets, credentials, generated build output, or private provider tokens.

## Area Notes

- Public API behavior lives in `app/api` and `lib/market-api`.
- Market API cache and free-tier rate limiting require Redis.
- Database schema source lives in `packages/db/schema.ts`.
- Upload behavior lives in `uploads` and upload API routes.

## License

Contributions are provided under the Apache License 2.0.
