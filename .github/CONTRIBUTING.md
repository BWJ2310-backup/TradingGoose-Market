# Contributing to TradingGoose Market

TradingGoose Market is the canonical market reference data service for TradingGoose. It manages listings, exchanges, cryptocurrencies, currencies, countries, cities, time zones, blockchain networks, market groups, and trading hours through a Next.js admin UI and a versioned public API.

This repository is a standalone Market app, not the TradingGoose Studio monorepo. Keep paths, setup steps, and pull request descriptions specific to this project.

## Project Layout

```text
app/
  (auth)/           Login and signup pages
  admin/            Admin UI pages and CRUD screens
  api/              Auth, health, search, get, update, uploads, and export routes
components/         Shared UI, table, settings, upload, and email components
hooks/              Shared React hooks
lib/
  auth/             Better Auth server and client config
  db/               Database client utilities and status checks
  email/            Email sending and rendering helpers
  market-api/       API auth, rate limiting, billing, caching, and versioned handlers
  ui/               Shared UI utilities
packages/
  db/               Drizzle schema, client, generated migrations, and DB package config
uploads/            Storage abstraction for local, Vercel Blob, and Azure Blob
scripts/            Install-time plugin tooling
```

## How to Contribute

1. Fork the repository.
2. Create a focused branch from the latest `main`.
3. Make the smallest coherent change that solves the problem.
4. Run the relevant validation commands.
5. Open a pull request against `main` unless a maintainer asks for a different base.

Use concise PR titles without tool-specific prefixes. Use Conventional Commits for commit messages, for example:

```text
fix(market-api): require Redis for response cache
docs(readme): document required environment variables
refactor(uploads): simplify provider selection
```

## Local Setup

### Requirements

- Bun 1.3+
- Docker or an existing PostgreSQL instance
- PostgreSQL 17 recommended
- Redis when working with response caching or free-tier rate limiting

### Run Locally

```bash
cp .env.example .env
bun install
bun run db:migrate
bun run dev
```

Open `http://localhost:3000/admin`. The first user to sign up becomes an admin; later signups require invitations.

Required environment variables for a normal local setup:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `NEXT_PUBLIC_APP_URL`
- `INTERNAL_API_SECRET`
- `REDIS_URL`

Optional integrations include `DATABASE_POOL_URL`, `DATABASE_POOL_MAX`, `MARKET_FREE_TIER_*`, `MARKET_RANK_UPDATE_ACCESS_MODE`, `RESEND_API_KEY`, `FROM_EMAIL_ADDRESS`, `OFFICIAL_TG_URL`, `STORAGE_SERVICE`, cloud storage credentials, `MARKET_PLUGIN_MODULES`, and `MARKET_PLUGIN_SOURCES`.

## Validation

Run the checks that match the files you changed. For most code changes, start with:

```bash
git diff --check main...HEAD
bun run type-check
ESLINT_USE_FLAT_CONFIG=false npx eslint .
```

The package currently has a `lint` script that invokes `next lint`; if that command fails before linting in your environment, document the failure and run the ESLint command above.

For database work:

```bash
bun run db:generate
bun run db:migrate
```

Only run Drizzle generation when schema changes require it.

## Development Guidelines

- Keep changes focused. Avoid mixing unrelated feature, refactor, formatting, and documentation work.
- Prefer the existing Next.js App Router, Server Component, API route, Drizzle, Better Auth, and shadcn/Radix patterns already in this repository.
- Keep public API behavior explicit. If you change `/api/search`, `/api/get`, `/api/update`, or their short rewrites, document compatibility and rollout impact.
- Treat `REDIS_URL` as required for response cache and free-tier rate limiting behavior.
- Do not add legacy fallback paths when replacing a behavior. Remove the old path and keep only the updated method.
- Do not edit files under any `*/migrations/` directory by hand. Generate migrations with Drizzle Kit when needed.
- Do not commit secrets, local credentials, generated build output, or private provider tokens.
- Update README, examples, environment docs, or PR notes when behavior, setup, configuration, or user-facing flows change.

## Database Changes

The database package lives in `packages/db`.

- Schema source belongs in `packages/db/schema.ts`.
- Drizzle migrations are generated artifacts under `packages/db/migrations/`.
- Never manually edit generated migration files.
- Include migration and rollout notes in the PR when schema behavior changes.

## Market API Changes

The public market API lives under `app/api` and `lib/market-api`.

- Versioned handlers live under `lib/market-api/v1`.
- Shared API auth, rate limiting, billing, Redis, and route helpers live under `lib/market-api/core`.
- Response cache behavior lives under `lib/market-api/v1/cache`.
- Plugin loading lives under `lib/market-api/plugins`.

When changing API behavior, document:

- Request or response shape changes.
- Cache, rate-limit, billing, or auth behavior changes.
- Required environment variable changes.
- Backward compatibility and rollout risk.

## Storage And Uploads

Uploads are handled by the `uploads` workspace and upload API routes.

- Local filesystem, Vercel Blob, and Azure Blob providers are supported.
- Provider selection is driven by `STORAGE_SERVICE` and provider credentials.
- Document provider behavior changes and credential requirements in the PR.

## Pull Requests

Before opening a PR:

- Rebase or update against `main`.
- Review your own diff.
- Ensure the PR template is complete.
- Include exact validation commands and outcomes.
- Call out env var, database, storage, provider, cache, auth, billing, or rollout impact.
- Include screenshots or video for visible UI changes.

Maintainers may ask for additional checks depending on the touched area.

## License

This project is licensed under the Apache License 2.0. By contributing, you agree that your contributions are provided under the same license terms.
