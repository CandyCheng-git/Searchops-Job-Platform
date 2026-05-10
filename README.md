# SearchOps — SEO-Aware Job Listing Platform

A cloud-native TypeScript project that demonstrates how public job pages can be built for search visibility, conversion tracking, testability, and platform reliability.

## Why this project exists

This project explores how a job-listing platform can:
- serve crawlable, SEO-ready job detail pages
- expose scalable REST APIs for search and filtering
- track meaningful user actions such as job views and apply clicks
- support automated testing, observability, and incident response
- use lightweight experimentation to inform product decisions

## Planned capabilities

- SEO-ready job detail pages with `JobPosting` structured data
- Search and filtering API
- Conversion event tracking
- A/B testing for apply-button wording
- Automated unit, integration, and end-to-end tests
- Health checks, structured logs, and latency monitoring
- Incident-response documentation for simulated production degradation

## Tech stack

- Frontend: React, TypeScript
- Backend: Node.js, TypeScript
- Database: PostgreSQL, Prisma
- Testing: Vitest, Supertest, Playwright
- DevOps: Docker, GitHub Actions
- Observability: structured logging, metrics, health checks

## Project status

Currently in initial architecture and setup phase.

## Engineering focus

This is intentionally not a feature-heavy CRUD application.  
The focus is on demonstrating:
1. maintainable TypeScript backend design
2. SEO-aware product engineering
3. test-driven delivery
4. observability and incident thinking
5. product metrics and experimentation