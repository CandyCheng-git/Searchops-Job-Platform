# Experimentation & A/B Testing Plan

## Experimentation Philosophy

SearchOps uses **A/B testing** to validate product hypotheses and drive measurable improvements. Every major product change is tested before full rollout.

**Hypothesis-driven approach:** Form hypothesis → Design experiment → Measure impact → Decide → Ship or iterate

---

## Experiment Framework

### Experiment Lifecycle

```
1. Design (1-2 days)
   ├─ Hypothesis
   ├─ Variants (control vs treatment)
   ├─ Metrics (success criteria)
   └─ Sample size

2. Implementation (2-3 days)
   ├─ Code changes
   ├─ Variant assignment logic
   ├─ Data validation
   └─ Staging validation

3. Rollout (5-7 days minimum)
   ├─ 5% of traffic
   ├─ Monitor metrics
   ├─ Ramp to 50%
   └─ Roll out 100% or abort

4. Analysis (1-2 days)
   ├─ Statistical significance
   ├─ Confidence intervals
   ├─ Secondary metrics
   └─ Document findings

5. Rollout or Iteration
   ├─ Full rollout if positive
   ├─ Iterate if neutral
   └─ Revert if negative
```

---

## Version 1 Experiment: Apply Button Wording

### Hypothesis

**"Users are more likely to apply for jobs when the apply button says 'Apply Today' vs. 'Apply Now.'**

The word "Today" creates urgency and commitment; "Now" is passive.

### Experiment Details

**Name:** `apply_button_wording_v1`

**Objective:** Increase apply click-through rate (CTR) by 5-10%

**Variants:**

| Variant | Description | Button Text | Deployed |
|---------|-------------|------------|----------|
| Control | Baseline (current) | "Apply Now" | 100% (stable baseline) |
| Treatment | Urgency variant | "Apply Today" | 50% for 7 days |

### Metrics

**Primary:**
- **Apply CTR:** (Apply clicks / Job views) × 100
- **Target:** Treatment ≥ Control + 5%
- **Statistical significance:** p < 0.05

**Secondary:**
- **Apply conversion rate:** (Applies / Job page views) × 100
- **Time to apply:** Seconds between landing on job page and clicking apply
- **Bounce rate:** Percentage of users who leave without interacting
- **Page load time:** Ensure button wording change doesn't slow page rendering

### Sample Size Calculation

```
Baseline apply CTR: 8%
Desired lift: 5% relative (8% → 8.4%)
Confidence level: 95%
Power: 90%

Sample size needed per variant: ~7,000 applies
Estimated time to collect: 7 days (assuming 500 applies/day per variant)
```

### Assignment Logic

**Variant assignment (deterministic by user):**

```typescript
// backend/src/services/ExperimentService.ts
export class ExperimentService {
  static assignVariant(jobId: string, userId?: string): 'control' | 'treatment' {
    const experiment = await db.experiment.findUnique({
      where: { name: 'apply_button_wording_v1' },
    });

    if (experiment.status !== 'running') {
      return 'control'; // Use control if experiment not active
    }

    // Deterministic assignment: same user always sees same variant
    const seed = userId || jobId; // Fall back to job ID if no user ID
    const hash = hashString(seed);
    const variant = hash % 2 === 0 ? 'control' : 'treatment';

    return variant;
  }
}
```

**Frontend variant selection:**

```typescript
// frontend/pages/jobs/[id].tsx
export default function JobDetail({ job }) {
  const [variant, setVariant] = useState<'control' | 'treatment'>('control');

  useEffect(() => {
    const fetchVariant = async () => {
      const res = await fetch(`/api/experiments/apply_button_wording_v1/variant`);
      const { variant } = await res.json();
      setVariant(variant);
    };
    fetchVariant();
  }, []);

  const buttonText = variant === 'control' ? 'Apply Now' : 'Apply Today';

  return (
    <button onClick={() => handleApply(job.id, variant)}>
      {buttonText}
    </button>
  );
}
```

**Event tracking:**

```typescript
// frontend/src/utils/tracking.ts
export function trackApplyClick(jobId: string, variant: 'control' | 'treatment') {
  fetch(`/api/events`, {
    method: 'POST',
    body: JSON.stringify({
      event_type: 'apply',
      job_id: jobId,
      experiment_id: 'apply_button_wording_v1',
      experiment_variant: variant,
      metadata: {
        button_text: variant === 'control' ? 'Apply Now' : 'Apply Today',
      },
    }),
  });
}
```

### Rollout Plan

**Day 1-3:** Validate in staging, canary deploy to 5% of production traffic

```bash
# Deploy code with experiment logic (feature flagged OFF)
git push origin main
# GitHub Actions: Tests pass, deploy to staging
# Staging validation: Manual test with both variants

# Canary: Route 5% of traffic to treatment variant
npm run experiment:start apply_button_wording_v1 --traffic=0.05
```

**Day 4-5:** Monitor metrics, increase to 50% if healthy

```bash
# Check metrics dashboard
curl http://localhost:5000/metrics | grep apply_click_ctr

# If healthy (no errors, no latency increase):
npm run experiment:scale apply_button_wording_v1 --traffic=0.5
```

**Day 6-7:** Monitor treatment variant, prepare full rollout

```bash
# Statistical analysis
npm run experiment:analyze apply_button_wording_v1

# Output:
# Control CTR: 8.1% (±0.3%)
# Treatment CTR: 8.7% (±0.3%)
# Lift: +7.4% relative (p = 0.023)
# Conclusion: Statistically significant, recommend full rollout
```

**Day 8:** Rollout or rollback

```bash
# If positive result:
npm run experiment:complete apply_button_wording_v1 --decision=rollout

# Update baseline code:
# Change "Apply Now" to "Apply Today" permanently
# Remove experiment branching logic
# Deploy as standard feature

# If negative result:
npm run experiment:complete apply_button_wording_v1 --decision=revert
```

### Success Criteria

| Metric | Control (Baseline) | Treatment (Target) | Result | Pass? |
|--------|------------------|--------------------|--------|-------|
| Apply CTR | 8.0% ± 0.3% | ≥ 8.4% ± 0.3% | 8.7% | ✅ Yes |
| Page load time | 1.2s | ≤ 1.2s | 1.18s | ✅ Yes |
| Bounce rate | 12% ± 1% | ≤ 12% | 11.5% | ✅ Yes |
| Error rate | <0.5% | <0.5% | 0.2% | ✅ Yes |

**Decision:** Deploy treatment variant as standard (remove experiment branching).

---

## Future Experiment Ideas

### Apply Form Optimization

**Hypothesis:** Reducing form fields from 5 to 3 increases apply completion rate.

| Metric | Target |
|--------|--------|
| Apply completion rate | +10% |
| Time to complete | -30% |

### Apply Button Position

**Hypothesis:** Moving apply button "above the fold" increases CTR by 8%.

| Metric | Target |
|--------|--------|
| Apply CTR | +8% |
| Job view duration | -5% (users don't need to scroll) |

### Search Result Ranking

**Hypothesis:** Showing salary-sorted results first increases apply rate vs. relevance-sorted.

| Metric | Target |
|--------|--------|
| Apply CTR | +5% |
| User satisfaction (bounce rate) | -3% |

### Job Description Length

**Hypothesis:** Short descriptions (< 200 words) increase apply rate vs. long descriptions.

| Metric | Target |
|--------|--------|
| Apply CTR | +12% |
| Job completion rate | Neutral or +5% |

---

## Experiment Management

### Database Schema

```typescript
model Experiment {
  id               String   @id @default(cuid())
  name             String   @unique
  hypothesis       String
  controlVariant   String
  treatmentVariant String
  status           String   // draft, running, completed, cancelled
  startedAt        DateTime?
  endedAt          DateTime?
  events           Event[]
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

### Experiment API

**Create experiment:**
```bash
POST /api/admin/experiments
{
  "name": "apply_button_wording_v1",
  "hypothesis": "Users apply more when button says 'Apply Today'",
  "controlVariant": "Apply Now",
  "treatmentVariant": "Apply Today"
}
```

**Start experiment:**
```bash
POST /api/admin/experiments/apply_button_wording_v1/start
{ "traffic_allocation": 0.05 }
```

**Get experiment stats:**
```bash
GET /api/admin/experiments/apply_button_wording_v1/stats
{
  "control": {
    "applies": 3500,
    "views": 43750,
    "ctr": 0.08,
    "ci_lower": 0.0765,
    "ci_upper": 0.0835
  },
  "treatment": {
    "applies": 3780,
    "views": 43500,
    "ctr": 0.087,
    "ci_lower": 0.0835,
    "ci_upper": 0.0905
  },
  "lift": 0.087 - 0.08 = 0.007 = 8.75%,
  "p_value": 0.023,
  "significant": true
}
```

---

## Statistical Rigor

### Confidence Intervals

All experiment results must include 95% confidence intervals:

```
Control CTR: 8.0% (±0.3%) 
  Interpretation: 95% confident true CTR is between 7.7% and 8.3%

Treatment CTR: 8.7% (±0.3%)
  Interpretation: 95% confident true CTR is between 8.4% and 9.0%
```

### P-Value

A result is statistically significant if p-value < 0.05 (5% chance of false positive).

### Peeking & Early Stopping

Do NOT look at results mid-experiment and stop early based on "winning" variant. This inflates false positive rate. Run full sample size.

**Exception:** Stop immediately if error rate spikes or performance degrades significantly (safety first).

---

## Rollback Procedures

If treatment variant has issues:

```bash
# Immediate: Reduce traffic to 0% (disable variant)
npm run experiment:stop apply_button_wording_v1

# Verify: All users back to control variant
curl http://localhost:5000/metrics | grep apply_click_ctr

# Investigate: Check logs and event data
grep "apply_button_wording_v1" /var/log/searchops/error.log

# Commit: Document what went wrong
git commit -m "Revert experiment due to [reason]"
```

---

## Experiment Success Checklist

Before launching any experiment:

- [ ] Hypothesis is clear and testable
- [ ] Sample size calculated (power analysis)
- [ ] Variants are mutually exclusive (no overlap)
- [ ] Metrics are measurable and tracked
- [ ] Variant assignment is deterministic (same user, same variant)
- [ ] Experiment logic tested in staging
- [ ] Rollback plan documented
- [ ] Team aware of experiment running
- [ ] Success criteria defined before starting

---

## Post-Experiment Documentation

After experiment completes, publish findings:

**Example report:**
```
# Experiment Report: Apply Button Wording v1

**Hypothesis:** "Apply Today" increases apply CTR vs. "Apply Now"

**Result:** Hypothesis confirmed ✅

**Metrics:**
- Control CTR: 8.0%
- Treatment CTR: 8.7%
- Lift: +8.75% relative
- P-value: 0.023 (significant)

**Recommendation:** Deploy "Apply Today" as standard

**Rollout Date:** 2026-05-17
```

Document in a shared wiki or GitHub discussion for team learning.
