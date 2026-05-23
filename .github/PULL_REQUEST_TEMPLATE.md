## Summary
<!-- What changed? Keep this concrete and specific to TradingGoose Market. -->

## Why
<!-- Why is this change needed? What problem does it solve? Include root cause for fixes. -->

## Affected Areas
<!-- Check all that apply. -->
- [ ] Admin UI / CRUD screens
- [ ] Auth, invitations, or team management
- [ ] Public API routes (`/api/search`, `/api/get`, `/api/update`, rewrites)
- [ ] Market API core (auth, billing, rate limiting, Redis, cache)
- [ ] Reference data model or entity behavior
- [ ] Uploads or storage providers
- [ ] Database schema, Drizzle package, or migrations
- [ ] Plugin installer or plugin runtime
- [ ] Email or external integrations
- [ ] Config, environment, deployment, or infra
- [ ] Documentation or repository metadata
- [ ] Other:

## Issue Links
<!-- Example: Fixes #123. Use N/A if none. -->

## Validation
<!-- List exact commands you ran and their result. Include known warnings/failures. -->
```bash
git diff --check main...HEAD
bun run type-check
ESLINT_USE_FLAT_CONFIG=false npx eslint .
```

## Risk / Rollout Notes
<!-- Call out breaking changes, rollout concerns, follow-up work, or backout plan. -->

## Config / Data Changes
<!-- Delete lines that do not apply. -->
- Env vars added or changed:
- Database schema or migration impact:
- Cache, rate-limit, billing, or auth behavior changed:
- Storage, email, plugin, or external provider behavior changed:

## Screenshots / Video
<!-- Required for visible UI changes. Use N/A for backend/docs-only changes. -->

## Checklist
- [ ] I kept the change focused and reviewed my own diff
- [ ] I validated the change locally and documented the results above
- [ ] I updated docs, examples, or copy if behavior/user-facing flows changed
- [ ] I called out env, schema, provider, cache, auth, billing, and rollout impact
- [ ] I did not manually edit generated files under `*/migrations/`
- [ ] I did not include secrets, tokens, or private credentials in this PR
