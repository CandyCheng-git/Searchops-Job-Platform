import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

describe('GET /health', () => {
  it('should return status ok', async () => {
    const app = createApp();
    const res = await request(app).get('/health').expect(200);

    expect(res.body).toEqual({
      data: {
        status: 'ok',
      },
      meta: expect.objectContaining({
        timestamp: expect.any(String),
        requestId: expect.any(String),
      }),
    });
  });

  it('should include request ID in response', async () => {
    const app = createApp();
    const res = await request(app).get('/health').expect(200);

    expect(res.get('x-request-id')).toBeDefined();
    expect(res.body.meta.requestId).toBeDefined();
  });

  it('should include valid timestamp', async () => {
    const app = createApp();
    const res = await request(app).get('/health').expect(200);

    const timestamp = new Date(res.body.meta.timestamp);
    expect(timestamp.getTime()).toBeGreaterThan(0);
  });
});
