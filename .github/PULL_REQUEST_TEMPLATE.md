## Summary
<!-- What changed? Keep it concrete. -->

## Why
<!-- Why is this needed? Include root cause for fixes. -->

## Affected Areas
<!-- Check all that apply. -->
- [ ] Admin UI / components
- [ ] Auth / invitations / team management
- [ ] Public API routes
- [ ] Market API core / cache / Redis / rate limits / billing
- [ ] Database / Drizzle / migrations
- [ ] Uploads / storage providers
- [ ] Plugins / install tooling
- [ ] Email / external integrations
- [ ] Config / env / deployment
- [ ] Docs / repository metadata
- [ ] Other:

## Validation
<!-- Exact commands run and results. Include known warnings/failures. -->
```bash
git diff --check main...HEAD
bun run type-check
ESLINT_USE_FLAT_CONFIG=false npx eslint .
```

## Rollout Notes
<!-- Env vars, schema changes, provider behavior, risk, backout plan. -->

## Screenshots / Video
<!-- Required for visible UI changes. Use N/A otherwise. -->

## Checklist
- [ ] I reviewed my own diff
- [ ] I documented validation results
- [ ] I called out env, schema, cache, provider, and rollout impact
- [ ] I did not manually edit generated files under `*/migrations/`
- [ ] I did not include secrets or private credentials
