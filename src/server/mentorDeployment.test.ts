import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import app from '../../api/mentor-advice';

describe('mentor API deployment entry point', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    if (server) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  });

  it('serves the authenticated API rather than the SPA HTML', async () => {
    const response = await fetch(`${baseUrl}/api/mentor-advice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    expect(response.status).toBe(401);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(await response.json()).toEqual({ error: 'Token de autenticação ausente.' });
  });

  it('excludes API routes from the Vercel SPA fallback', () => {
    const config = JSON.parse(readFileSync('vercel.json', 'utf8'));
    const fallback = new RegExp(`^${config.rewrites[0].source}$`);
    expect(fallback.test('/api/mentor-advice')).toBe(false);
    expect(fallback.test('/api')).toBe(false);
    expect(fallback.test('/')).toBe(true);
    expect(fallback.test('/dashboard')).toBe(true);
  });
});
