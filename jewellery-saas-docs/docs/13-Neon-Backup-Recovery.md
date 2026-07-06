# 13 — Neon Backup & Disaster Recovery Runbook

> **Document status:** Production Runbook · **Phase:** 1 (Next.js web only) · **Owner:** DevOps / Reliability Engineering
> **Related docs:** [`03-Database-Design.md`](./03-Database-Design.md) · [`05-Multi-Tenancy.md`](./05-Multi-Tenancy.md)

---

## 1. Neon Database Branching Primitive
Neon PostgreSQL provides instant, copy-on-write database branching. A branch is created in milliseconds and carries no extra storage cost initially. We leverage branching for:
1. **Point-in-Time Recovery (PITR)**: Restoring database state to an exact timestamp or LSN.
2. **Staging / Preview Testing**: Safe execution of migrations on staging or temporary preview environments.

---

## 2. Point-in-Time Recovery (PITR) Steps
If a catastrophic tenant data deletion or schema corruption occurs:

### Step 1: Identify the Corruption Timestamp
Retrieve the timestamp immediately preceding the incident from the `AuditLog` table or application logs.
* Example target time: `2026-07-05T14:30:00Z`

### Step 2: Create a Recovery Branch
Use the Neon CLI or Web Console to branch the database at that exact timestamp.
```bash
neon branches create \
  --name recovery-branch-20260705 \
  --parent-id main \
  --as-of "2026-07-05T14:30:00Z" \
  --project-id <project-id>
```
*Alternatively, you can branch from a specific Log Sequence Number (LSN) if known.*

### Step 3: Validate the Recovery Branch
1. Spin up a temporary container or staging task.
2. Connect to the connection string of the new branch:
   ```env
   DATABASE_URL="postgresql://user:password@ep-recovery-branch-1234.neon.tech/neondb?sslmode=require"
   ```
3. Run smoke tests and verify that the deleted/corrupted tenant records are fully restored.

### Step 4: Promote to Production
Once validated, you can swap the branches:
1. Put the application in maintenance mode (suspend traffic).
2. Rename the current corrupted branch to `main-corrupted-backup`.
3. Rename the recovery branch to `main`.
4. Update the connection string env variables in Vercel to point to the new branch if needed (if using pooled DNS aliases, no change is required).
5. Bring the application back online.

---

## 3. Manual Backups (pg_dump)
As an extra layer of protection, automated logical daily backups are exported to Cloudflare R2.

### Runbook for Manual Export:
```bash
pg_dump \
  -d "postgresql://direct-user:password@ep-direct-1234.neon.tech/neondb?sslmode=require" \
  -F c \
  -b \
  -v \
  -f "/backups/db-backup-$(date +%F).dump"
```

### Runbook for Manual Restore (on a clean branch):
```bash
pg_restore \
  -d "postgresql://direct-user:password@ep-clean-branch-5678.neon.tech/neondb?sslmode=require" \
  --clean \
  --no-owner \
  --no-privileges \
  -v "/backups/db-backup-YYYY-MM-DD.dump"
```

---

## 4. Disaster Recovery (DR) Checklist
- [ ] Verify that automatic Daily Backups are green in Neon console dashboard.
- [ ] Perform a PITR branching dry-run once every 3 months on a staging branch.
- [ ] Confirm database connection pooling limits: verify PgBouncer/Serverless limits are active and alert thresholds are configured at 80% capacity.
