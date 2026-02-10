/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { describe, it, expect, mock, beforeAll, afterAll } from "bun:test";

// Mock next/server BEFORE importing route
mock.module("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number; statusText?: string }) => {
      return new Response(JSON.stringify(body), {
        status: init?.status || 200,
        statusText: init?.statusText || "OK",
        headers: { "Content-Type": "application/json" }
      });
    }
  }
}));

// Mock rate-limit lib
mock.module("@/lib/rate-limit", () => ({
  apiRateLimit: {
    limit: mock(() => Promise.resolve({ success: false, limit: 100, remaining: 0, reset: 0 }))
  },
  checkRateLimitInMemory: mock(() => ({ allowed: false })),
  getClientIdentifier: mock(() => "test-ip")
}));

// Mock inngest
mock.module("@/lib/inngest/client", () => ({
  inngest: {
    send: mock(() => Promise.resolve())
  }
}));

// Mock env lib
mock.module("@/lib/env", () => ({
  env: {
    GITHUB_WEBHOOK_SECRET: "mock-secret"
  }
}));

import { POST } from "./route";

describe("GitHub Webhook Rate Limiting", () => {
  const originalEnv = process.env;

  beforeAll(() => {
    process.env.UPSTASH_REDIS_REST_URL = "https://mock.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "mock-token";
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should return 429 when rate limit is exceeded", async () => {
    const request = new Request("http://localhost/api/webhooks/github", {
      method: "POST",
      body: JSON.stringify({}),
      headers: {
        "x-github-event": "push"
      }
    });

    const response = await POST(request);

    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.error).toBe("Too many requests");
  });
});
