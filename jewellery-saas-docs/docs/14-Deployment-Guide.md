# 14 — Production Deployment & Release Guide

> **Document status:** Production Runbook · **Phase:** 1 (Next.js web only) · **Owner:** Release Management / DevOps
> **Related docs:** [`11-Development-Roadmap.md`](./11-Development-Roadmap.md) · [`12-Coding-Standards.md`](./12-Coding-Standards.md)

---

## 1. Deployment Environments
The platform is structured across three environments:
* **Preview**: Ephemeral Vercel preview URLs paired with temporary Neon DB branches generated per Pull Request.
* **Staging**: Static staging alias (`staging.jewellery-erp.com`) connected to a Neon `staging` DB branch with production-like data volumes.
* **Production**: Root domain connected to Neon `main` DB branch.

---

## 2. Release & Promotion Process

```
[Feature Branch] ──(PR to main)──> [Preview Env] ──(Merge)──> [Staging Deploy] ──(Promotion)──> [Production Deploy]
```

### Phase 1: Code Review & Preview Check
1. Open a Pull Request targeting `main`.
2. Vercel automatically deploys a Preview environment.
3. CI runs lint, typechecks, Vitest tests, and prisma validation.
4. Developers review the preview deployment, verifying UI details and tenant isolation.

### Phase 2: Merge & Staging Validation
1. Merge the approved Pull Request into `main`.
2. Staging automatically rebuilds.
3. Run migrations on staging using direct database connection strings.
4. Execute End-to-End E2E regression tests (`pnpm run test:e2e`).
5. Product Owner signs off on the staging candidate.

### Phase 3: Production Rollout
1. Ensure all items in the **Launch Checklist** (see §3 below) are completed.
2. Trigger the production promotion pipeline on Vercel.
3. Apply database migrations:
   ```bash
   pnpm prisma migrate deploy
   ```
4. Verify deployment health and run core smoke tests on production.

---

## 3. Go / No-Go Checklist
Before promoting any release candidates to Production, the following criteria must be met:

- [ ] **Tests**: All unit, integration, and E2E Playwright tests are 100% passing in CI.
- [ ] **Migrations**: DB migrations are backward-compatible (no column renaming or dropped fields without pre-migration deployment).
- [ ] **Environment**: No missing environment variables in production settings.
- [ ] **Approval**: Staging sign-off received from Engineering Lead and Product Owner.

---

## 4. Rollback Runbook
If a critical incident occurs immediately following a production deployment:

### Scenario A: Application Code Fault (No DB Schema Changes)
Redeploy the previous successful Vercel build alias.
1. Locate the last green deployment on the Vercel dashboard.
2. Click **Promote to Production** on that specific build.
3. Rollback completes instantly (approx. 5 seconds) without container rebuilds.

### Scenario B: Schema Fault (Incompatible Migrations)
1. Revert the application code using Vercel rollback.
2. If the schema contains breaking additions, restore the database to the pre-deployment timestamp using the [Neon PITR runbook](./13-Neon-Backup-Recovery.md).
3. Re-route production traffic back to the restored database branch.
