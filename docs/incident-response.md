# Incident Response Runbook

## Purpose

This document outlines SearchOps incident response procedures using a **simulated incident**: Search API latency exceeds 800ms due to a missing database index.

This serves as a template for detecting, investigating, and resolving production issues.

---

## Incident: Search API Latency Degradation

### Scenario Summary

A developer accidentally dropped the `idx_jobs_title_tsvector` index during a migration. Subsequent search queries now scan the entire `jobs` table, causing p95 latency to spike from 320ms to 1200ms. Users experience slow search, increasing bounce rate.

---

## Detection

### Alert Triggered

**Alert Name:** `HighLatency`

**Condition:** `p95(http_request_duration_ms{path="/api/jobs"}) > 800ms for 5 minutes`

**Notification:** Pagerduty alert → Slack → On-call engineer

**Log:**
```json
{
  "timestamp": "2026-05-10T15:30:00Z",
  "alert": "HighLatency",
  "metric": "http_request_duration_ms",
  "path": "/api/jobs",
  "threshold": "800ms",
  "actual": "1200ms (p95)",
  "duration": "5 minutes",
  "action": "Page on-call engineer"
}
```

---

## Incident Timeline

### T+0m: Alert fires

**Time:** 2026-05-10 15:30 UTC

On-call engineer receives alert in Slack:
```
🚨 ALERT: SearchOps API latency high
Path: /api/jobs
p95 latency: 1200ms (threshold: 800ms)
Duration: 5 minutes
```

### T+2m: Acknowledge incident

On-call engineer acknowledges alert in Pagerduty. Severity: **High** (users affected, revenue at risk).

**Initial diagnosis:** Start investigation.

---

## Investigation Phase

### Step 1: Confirm Alert

**Command:**
```bash
# Check current latency
curl -s http://localhost:5000/health | jq '.'

# Output should show if service is healthy
# If healthy: proceed to check specific endpoints
```

**Output:**
```json
{
  "data": {
    "status": "healthy",
    "database": "connected",
    "timestamp": "2026-05-10T15:32:00Z"
  }
}
```

**Observation:** Service is up, but search endpoint may be slow.

### Step 2: Check Search Endpoint Latency

**Command:**
```bash
# Time a search request
time curl "http://localhost:5000/api/jobs?q=python&limit=10" | jq '.meta.latency_ms'
```

**Output:**
```
real    0m1.234s
user    0m0.012s
sys     0m0.008s
latency_ms: 1156
```

**Observation:** Confirmed—search taking 1.1+ seconds. This is abnormal (baseline: 320ms p95).

### Step 3: Check Recent Deployments/Changes

**Command:**
```bash
# Check git log for recent database changes
git log --oneline -10 -- "backend/migrations/"
```

**Output:**
```
a1f2e3d (HEAD) Drop unused search index for cleanup
9c8d7b6 Add search index for job titles
2e1f5a4 Initial migration
```

**Observation:** Most recent change dropped an index! That's likely the culprit.

### Step 4: Verify Index Status

**Command:**
```bash
# Connect to database and list indexes
psql $DATABASE_URL -c "\d jobs"
```

**Output:**
```
               Table "public.jobs"
       Column       |            Type             
─────────────────────────────────────────────────
 id                | uuid
 title             | text
 description       | text
 ...

Indexes:
    "jobs_pkey" PRIMARY KEY, btree (id)
    "idx_jobs_company_id" btree (company_id)
    "idx_jobs_location" btree (location)
    "idx_jobs_level" btree (level)
    "idx_jobs_posted_at" btree (posted_at DESC)
    
# MISSING: "idx_jobs_title_tsvector" btree
```

**Observation:** The full-text search index is missing! This forces the database to do a sequential scan of 500k job records.

### Step 5: Query Plan Analysis

**Command:**
```bash
# Analyze query execution plan (with missing index)
psql $DATABASE_URL -c "
  EXPLAIN ANALYZE
  SELECT * FROM jobs 
  WHERE to_tsvector('english', title) @@ plainto_tsquery('english', 'python')
  LIMIT 20;"
```

**Output:**
```
Seq Scan on jobs  (cost=0.00..52341.00 rows=14 width=456)
  Filter: (to_tsvector('english', title) @@ plainto_tsquery('english', 'python'))
  Planning Time: 0.051 ms
  Execution Time: 1156.234 ms
```

**Observation:** 
- `Seq Scan` = scanning entire table
- Cost: 52,341 (expensive)
- Execution time: 1156ms (our symptom)
- With index, cost would be <100, time <50ms

**Root Cause: Confirmed—missing index.**

---

## Resolution Phase

### Step 1: Recreate Missing Index

**Command:**
```bash
# Recreate the full-text search index
psql $DATABASE_URL -c "
  CREATE INDEX idx_jobs_title_tsvector 
  ON jobs USING GIN(to_tsvector('english', title));"
```

**Output:**
```
CREATE INDEX
Time: 3245.123 ms
```

**Observation:** Index creation took ~3.2 seconds (one-time operation).

### Step 2: Verify Index Exists

**Command:**
```bash
# Confirm index is present
psql $DATABASE_URL -c "\d jobs" | grep idx_jobs_title_tsvector
```

**Output:**
```
"idx_jobs_title_tsvector" gin, (to_tsvector('english', title))
```

**Observation:** Index is now present.

### Step 3: Test Latency

**Command:**
```bash
# Time the same search query again
time curl "http://localhost:5000/api/jobs?q=python&limit=10"
```

**Output:**
```
real    0m0.247s
user    0m0.008s
sys     0m0.004s
latency_ms: 240
```

**Observation:** Latency dropped from 1156ms → 240ms. **Incident resolved.**

### Step 4: Verify Metrics Return to Baseline

**Command:**
```bash
# Check metrics endpoint
curl http://localhost:5000/metrics | grep -A 5 http_request_duration_ms
```

**Expected output:**
```
# p95 should now be ~320ms (baseline)
```

---

## Post-Incident Phase

### Step 1: Create Fix Commit

**Command:**
```bash
git log --oneline -1
# Output: a1f2e3d Drop unused search index for cleanup

# Revert the problematic commit
git revert a1f2e3d

# New commit message:
# "Revert: Restore idx_jobs_title_tsvector to fix search latency regression"
```

**Observation:** Version control documents the incident and fix.

### Step 2: Deploy Fix

**Command:**
```bash
# Push fix to main, GitHub Actions runs tests and deploys
git push origin main

# Verify deployment
curl -s http://localhost:5000/api/jobs?q=python | jq '.data.jobs | length'
# Output: 20 (search working)
```

### Step 3: Run Incident Analysis

**Postmortem Questions:**

1. **What happened?**
   - Developer dropped `idx_jobs_title_tsvector` index in migration commit a1f2e3d
   - Missing index caused sequential table scans for searches
   - p95 latency spiked to 1200ms (threshold: 800ms)

2. **Why did it happen?**
   - Migration comments said "drop unused search index for cleanup"
   - Developer didn't realize index was critical for search performance
   - No test verified search performance baseline

3. **Why didn't we catch it?**
   - Missing integration test: "search latency should be <500ms"
   - No CI/CD check for index existence after migration
   - Staging environment is smaller (fewer rows), so slowness wasn't obvious

4. **What's the fix?**
   - Reverted commit a1f2e3d to restore index
   - Added test: `test('search should complete in <500ms')`
   - Added pre-deployment check: verify all critical indexes exist

5. **How do we prevent this?**
   - **Procedural:** Code review must check migrations for index drops
   - **Technical:** Add migration validation test
   - **Observability:** Monitor index health as part of daily checks
   - **Documentation:** Flag critical indexes in data-model.md

### Step 4: Create Prevention Tickets

**Tickets to open:**

1. **Add search latency test** (priority: high)
   ```typescript
   it('should search 100k jobs in <500ms', async () => {
     const start = Date.now();
     const res = await request(app)
       .get('/api/jobs?q=python&limit=20')
       .expect(200);
     const duration = Date.now() - start;
     expect(duration).toBeLessThan(500);
   });
   ```

2. **Add index health check** (priority: high)
   ```bash
   # Run before deployment
   npm run test:indexes
   # Checks: Are all critical indexes present?
   ```

3. **Document critical indexes** (priority: medium)
   - Add comment to data-model.md: "CRITICAL: Remove only after confirming no queries depend on this."

4. **Add index validation to CI/CD** (priority: medium)
   - GitHub Actions step: Verify migrations don't drop critical indexes

---

## Response Time Summary

| Phase | Duration | Owner |
|-------|----------|-------|
| Detection (alert) | 0m | Monitoring |
| Acknowledge | 2m | On-call |
| Investigation | 8m | On-call |
| Resolution | 1m | On-call |
| Deployment | 3m | GitHub Actions |
| Verification | 2m | On-call |
| **Total time to recovery** | **16 minutes** | — |

**Impact:** 16 minutes of degraded search experience for users.

---

## Key Learnings

### Detection Worked ✅
- Alert fired at p95 > 800ms threshold
- On-call engineer was notified within 2 minutes
- System was not down; degradation was caught early

### Investigation Was Efficient ✅
- Systematic approach (check health → check endpoint → check logs → check migrations)
- Root cause found in <10 minutes
- Developer understood the index design

### Prevention Gaps ❌
- No performance regression test
- No index health check in CI/CD
- Migration comments not reviewed carefully enough

---

## Escalation Procedures

If incident is not resolved within 15 minutes:

1. **Page backup on-call** (if single on-call is stuck)
2. **Escalate to team lead** (if unknown root cause)
3. **Consider rollback** (if fix takes >30 min and is risky)
4. **Notify stakeholders** (if incident lasts >30 min)

**Do NOT:**
- Restart services as first step (wastes time)
- Make multiple changes simultaneously (hard to debug)
- Deploy a fix without testing in staging (causes new incidents)

---

## Related Documentation

- [Observability Strategy](observability.md) — Detection and alerting
- [Data Model](data-model.md) — Critical indexes flagged
- [Testing Strategy](testing-strategy.md) — Performance regression tests
- [API Contract](api-contract.md) — Search endpoint SLA (p95 ≤ 500ms)

---

## Simulation Exercise

**Run this in a test environment to practice:**

```bash
# 1. Create test database
npm run db:migrate:test

# 2. Seed with 100k test jobs
npm run db:seed:test

# 3. Verify normal latency
curl http://localhost:5000/api/jobs?q=python

# 4. Simulate incident: drop index
psql $DATABASE_URL -c "DROP INDEX idx_jobs_title_tsvector;"

# 5. Measure degraded latency
time curl http://localhost:5000/api/jobs?q=python

# 6. Fix: recreate index
psql $DATABASE_URL -c "CREATE INDEX idx_jobs_title_tsvector ON jobs USING GIN(to_tsvector('english', title));"

# 7. Verify recovery
time curl http://localhost:5000/api/jobs?q=python
```

**Expected outcome:** Latency degrades from ~200ms → ~1000ms, then recovers to ~200ms after index recreation.
