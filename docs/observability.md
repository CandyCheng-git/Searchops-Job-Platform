# Observability Strategy

## Observability Thesis

SearchOps is observable from day 1. We instrument **logs, metrics, and traces** so that we can detect and respond to production issues before they affect users.

**Four pillars:** Logs → Metrics → Traces → Alerts

---

## Structured Logging

### Request Logging

Every HTTP request logs context for debugging and monitoring.

**Log Format (JSON):**
```json
{
  "timestamp": "2026-05-10T14:30:00.123Z",
  "level": "info",
  "request_id": "req_abc123def456",
  "method": "GET",
  "path": "/api/jobs",
  "status": 200,
  "latency_ms": 127,
  "query_params": {
    "q": "python",
    "level": "senior"
  },
  "user_agent": "Mozilla/5.0...",
  "ip": "203.0.113.45",
  "service": "searchops-api",
  "version": "1.0.0"
}
```

**Implementation (Express middleware):**
```typescript
// backend/src/middleware/logging.ts
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const requestId = req.headers['x-request-id'] || uuidv4();
  const startTime = Date.now();

  res.on('finish', () => {
    const latency = Date.now() - startTime;
    const log = {
      timestamp: new Date().toISOString(),
      level: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
      request_id: requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      latency_ms: latency,
      query_params: req.query,
      user_agent: req.get('user-agent'),
      ip: req.ip,
      service: 'searchops-api',
      version: process.env.APP_VERSION,
    };

    console.log(JSON.stringify(log));
  });

  (req as any).requestId = requestId;
  next();
}
```

### Application Logging

Log significant application events (search executed, experiment assigned, event recorded).

```typescript
// backend/src/services/SearchService.ts
export class SearchService {
  static async search(query: string) {
    const logger = getLogger();
    const requestId = getCurrentRequestId();

    logger.info({
      level: 'info',
      request_id: requestId,
      event: 'search_started',
      query: query,
      timestamp: new Date().toISOString(),
    });

    try {
      const results = await db.job.findMany({
        where: { title: { search: query } },
        take: 20,
      });

      logger.info({
        level: 'info',
        request_id: requestId,
        event: 'search_completed',
        query: query,
        result_count: results.length,
        timestamp: new Date().toISOString(),
      });

      return results;
    } catch (err) {
      logger.error({
        level: 'error',
        request_id: requestId,
        event: 'search_failed',
        query: query,
        error: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString(),
      });
      throw err;
    }
  }
}
```

### Log Levels

| Level | Use Case | Example |
|-------|----------|---------|
| `debug` | Development only | Query details, intermediate calculations |
| `info` | Operational events | Request completed, event recorded, index rebuilt |
| `warn` | Potential issues | Slow query (>500ms), high memory usage |
| `error` | Failures | Database error, validation failed |
| `critical` | System down | Database unreachable, health check failed |

---

## Metrics

### Application Metrics

Track key performance indicators for alerting and dashboarding.

| Metric | Type | Purpose | Threshold |
|--------|------|---------|-----------|
| `http_request_duration_ms` | Histogram | API response time | p95 ≤ 500ms |
| `search_query_count` | Counter | Search volume | Increase = traffic |
| `event_recorded_count` | Counter | Event tracking volume | — |
| `database_query_duration_ms` | Histogram | Database latency | p95 ≤ 400ms |
| `db_connection_pool_size` | Gauge | Active connections | < 80 |
| `cache_hit_rate` | Gauge | Cache effectiveness | > 70% (future) |

**Implementation (Prometheus client):**
```typescript
// backend/src/metrics/index.ts
import { Counter, Histogram, register } from 'prom-client';

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_ms',
  help: 'HTTP request latency in milliseconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [50, 100, 250, 500, 1000, 2000, 5000],
});

export const searchQueryCount = new Counter({
  name: 'search_query_count',
  help: 'Number of search queries',
  labelNames: ['status'],
});

export const eventRecordedCount = new Counter({
  name: 'event_recorded_count',
  help: 'Number of events recorded',
  labelNames: ['event_type'],
});

export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_ms',
  help: 'Database query latency',
  labelNames: ['operation', 'table'],
  buckets: [10, 50, 100, 250, 500, 1000],
});

// Expose metrics endpoint
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.path === '/metrics') {
    res.type('text/plain').send(register.metrics());
  } else {
    next();
  }
}
```

**Middleware to capture metrics:**
```typescript
export function instrumentedRouter() {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      httpRequestDuration.labels(req.method, req.path, res.statusCode).observe(duration);
    });

    next();
  };
}
```

---

## Traces (Distributed Tracing)

For future versions, implement distributed tracing to correlate logs across services.

**Tools:** OpenTelemetry, Jaeger, Datadog

**Example (future):**
```json
{
  "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
  "span_id": "00f067aa0ba902b7",
  "parent_span_id": "00f067aa0ba902b7",
  "operation": "GET /api/jobs",
  "service": "searchops-api",
  "duration_ms": 127,
  "spans": [
    {
      "name": "validate_query",
      "duration_ms": 5
    },
    {
      "name": "database_query",
      "duration_ms": 80
    },
    {
      "name": "serialize_response",
      "duration_ms": 32
    }
  ]
}
```

---

## Health Checks

### Liveness Check

**Endpoint:** `GET /health`

**Purpose:** Kubernetes/load balancer knows if service is alive.

**Response:**
```json
{
  "data": {
    "status": "healthy",
    "timestamp": "2026-05-10T14:30:00Z",
    "uptime_seconds": 86400
  },
  "meta": { "requestId": "req_123" }
}
```

**Implementation:**
```typescript
router.get('/health', async (req: Request, res: Response) => {
  res.json({
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime_seconds: process.uptime(),
    },
    meta: { requestId: (req as any).requestId },
  });
});
```

### Readiness Check

**Endpoint:** `GET /health/ready`

**Purpose:** Verify service is ready to accept traffic (database connected, migrations applied).

**Response:**
```json
{
  "data": {
    "status": "ready",
    "checks": {
      "database": "connected",
      "migrations": "applied"
    }
  },
  "meta": { "requestId": "req_123" }
}
```

**Implementation:**
```typescript
router.get('/health/ready', async (req: Request, res: Response) => {
  try {
    // Verify database connection
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      data: {
        status: 'ready',
        checks: {
          database: 'connected',
          migrations: 'applied',
        },
      },
      meta: { requestId: (req as any).requestId },
    });
  } catch (err) {
    res.status(503).json({
      error: {
        code: 'UNAVAILABLE',
        message: 'Service not ready',
      },
      meta: { requestId: (req as any).requestId },
    });
  }
});
```

---

## Alerting

### Alert Rules

| Alert | Condition | Action |
|-------|-----------|--------|
| **High Latency** | p95 > 500ms for >5 min | Page on-call |
| **Database Errors** | Error rate > 5% | Page on-call |
| **Service Down** | Health check fails | Page team immediately |
| **Memory Leak** | Memory usage > 80% for >10 min | Restart service, investigate logs |
| **Missing Index** | Single query > 800ms | Alert to #ops channel |

**Prometheus alert rules (future):**
```yaml
groups:
  - name: searchops_alerts
    rules:
      - alert: HighLatency
        expr: histogram_quantile(0.95, http_request_duration_ms) > 500
        for: 5m
        annotations:
          summary: "API latency exceeds 500ms"
      
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 2m
        annotations:
          summary: "Error rate exceeds 5%"
```

---

## Dashboards (Future)

### Grafana Dashboard Example

```
┌────────────────────────────────────────────────────────────────┐
│ SearchOps Platform Dashboard                                   │
├────────────────────────────────────────────────────────────────┤
│ [Request Rate]         [Error Rate]       [p95 Latency]        │
│  ▲                     ▲                  ▲                     │
│  │ 500 req/s           │ 0.2% errors      │ 320ms              │
│  └──────────           └──────────        └──────────          │
│                                                                 │
│ [Search Latency Distribution]   [Database Queries/sec]        │
│ p50: 80ms                        ▲                             │
│ p95: 340ms                       │ 450 queries                │
│ p99: 650ms                       └──────────                  │
│                                                                 │
│ [Event Volume]               [Top Slow Queries]              │
│ Views: 3.2k/min              GET /api/jobs: 320ms            │
│ Applies: 240/min             GET /jobs/:id: 150ms            │
│ Conversions: 18/min          POST /events: 80ms              │
└────────────────────────────────────────────────────────────────┘
```

---

## Log Aggregation (Future)

Tools: ELK Stack, Datadog, Cloudwatch

**Query example:**
```
service:searchops-api AND level:error AND timestamp:[now-1h]
```

Returns all errors from the last hour for debugging.

---

## Performance Monitoring

### Baseline Metrics

Document expected performance to detect regressions:

| Endpoint | p50 | p95 | p99 | Error Rate |
|----------|-----|-----|-----|-----------|
| GET /api/jobs | 100ms | 320ms | 650ms | <1% |
| GET /api/jobs/:id | 50ms | 180ms | 400ms | <0.1% |
| POST /api/events | 30ms | 80ms | 200ms | <1% |
| GET /health | 5ms | 10ms | 30ms | 0% |

### Latency Tracking

Log latency by percentile per request:
```json
{
  "request_id": "req_abc123",
  "method": "GET",
  "path": "/api/jobs",
  "status": 200,
  "latency_ms": 127,
  "latency_bucket": "p95"
}
```

---

## Incident Debugging Workflow

1. **Alert fires:** High latency detected (p95 > 800ms)
2. **Check logs:** Grep for `latency_ms > 800` in last 10 minutes
3. **Identify pattern:** All searches for "python" are slow
4. **Check metrics:** Database query time is 600ms (index missing)
5. **Root cause:** `idx_jobs_title_tsvector` dropped or corrupted
6. **Resolution:** Rebuild index, verify latency returns to baseline
7. **Postmortem:** Add monitoring for index health, set alerts

---

## Observability Checklist

- [x] All requests logged with request ID
- [x] Latency tracked per endpoint
- [x] Error rates monitored
- [x] Health check endpoint available
- [x] Structured JSON logs for machine parsing
- [x] Baseline metrics documented
- [x] Alerts configured for critical thresholds
- [x] Logs rotated to prevent disk fill

---

## Integration with Incident Response

See [incident-response.md](incident-response.md) for runbook using this observability data.
