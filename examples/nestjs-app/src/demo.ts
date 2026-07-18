/**
 * End-to-end demo — starts the NestJS server, exercises every endpoint
 * via the built-in Node.js fetch API, then shuts down.
 *
 * Run:  pnpm demo          (or: node dist/demo.js)
 * Requires: Neo4j running (docker compose up -d)
 */

import 'dotenv/config';
import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

const PORT = process.env.PORT ?? 3000;
const BASE = `http://localhost:${PORT}`;

// ── helpers ─────────────────────────────────────────────────────

async function request(
  method: string,
  path: string,
  body?: Record<string, unknown>,
) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  console.log(`  ${method} ${path} → ${res.status}`, data ?? '');
  if (!res.ok) {
    throw new Error(`${method} ${path} failed with ${res.status}`);
  }
  return data;
}

// ── main ────────────────────────────────────────────────────────

async function main() {
  const app = await NestFactory.create(AppModule, { logger: ['error'] });
  await app.listen(PORT);
  console.log(`\nServer started on port ${PORT}\n`);

  try {
    // ── Clean up leftovers from previous runs ─────────────────
    console.log('── Cleanup (previous runs) ──');
    await request('DELETE', '/users');

    // ── Health check ──────────────────────────────────────────
    console.log('\n── Health ──');
    await request('GET', '/health');

    // ── Create users ──────────────────────────────────────────
    console.log('\n── Create ──');
    await request('POST', '/users', {
      id: 'demo-1',
      name: 'Alice',
      email: 'alice@example.com',
      age: 30,
    });
    await request('POST', '/users', {
      id: 'demo-2',
      name: 'Bob',
      email: 'bob@example.com',
    });

    // ── List all users ────────────────────────────────────────
    console.log('\n── List ──');
    await request('GET', '/users');

    // ── Get single user ───────────────────────────────────────
    console.log('\n── Get by ID ──');
    await request('GET', '/users/demo-1');

    // ── Update a user ─────────────────────────────────────────
    console.log('\n── Update ──');
    await request('PATCH', '/users/demo-1', {
      name: 'Alice Updated',
      age: 31,
    });

    // ── Verify update ─────────────────────────────────────────
    console.log('\n── Verify update ──');
    await request('GET', '/users/demo-1');

    // ── Delete single user ────────────────────────────────────
    console.log('\n── Delete one ──');
    await request('DELETE', '/users/demo-2');

    // ── Clean up ──────────────────────────────────────────────
    console.log('\n── Clean up (delete all) ──');
    await request('DELETE', '/users');

    // ── Verify empty ──────────────────────────────────────────
    console.log('\n── Verify empty ──');
    await request('GET', '/users');

    console.log('\nAll requests completed successfully.\n');
  } finally {
    await app.close();
    console.log('Server shut down.\n');
  }
}

main().catch((err) => {
  console.error('Demo failed:', err);
  process.exitCode = 1;
});
