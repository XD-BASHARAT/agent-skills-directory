/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { describe, it, expect, mock } from "bun:test";

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

// Mock env
mock.module("@/lib/env", () => ({
  env: {
    GITHUB_WEBHOOK_SECRET: undefined // Simulate missing secret
  }
}));

// Mock inngest
mock.module("@/lib/inngest/client", () => ({
  inngest: {
    send: mock(() => Promise.resolve())
  }
}));

import { POST } from "./route";

describe("GitHub Webhook Vulnerability", () => {
  it("should process webhook without signature if secret is missing", async () => {
    const payload = JSON.stringify({
      ref: "refs/heads/main",
      repository: {
        owner: { login: "test-owner" },
        name: "test-repo",
        full_name: "test-owner/test-repo"
      },
      head_commit: {
        added: ["skills/test/SKILL.md"],
        modified: [],
        removed: []
      }
    });

    const request = new Request("http://localhost/api/webhooks/github", {
      method: "POST",
      body: payload,
      headers: {
        "x-github-event": "push"
      }
    });

    const response = await POST(request);

    // Vulnerability fixed: Should return 500 because signature check is mandatory
    expect(response.status).toBe(500);

    const body = await response.json();
    expect(body.error).toBe("Server configuration error");
  });
});
