import { describe, it, expect, mock } from "bun:test";

// Mock next/server
mock.module("next/server", () => {
  return {
    NextResponse: {
      json: (body: any, init: any) => ({
        status: init?.status || 200,
        json: () => Promise.resolve(body),
      }),
    },
  };
});

// Mock lib/features/skills/sync
mock.module("@/lib/features/skills/sync", () => ({
  syncRepoSkills: () => Promise.resolve({
    success: true,
    owner: "test",
    repo: "test",
    total: 1,
    synced: 1,
    failed: 0,
    skills: [],
    errors: []
  })
}));

describe("Sync Repo Auth", () => {
  it("should fail closed (500) if SYNC_SECRET_TOKEN is missing", async () => {
    // Mock env to return undefined
    mock.module("@/lib/env", () => ({
      env: {
        SYNC_SECRET_TOKEN: undefined
      }
    }));

    // Re-import route to apply mock
    const { POST } = await import("./route");

    const payload = JSON.stringify({ repoUrl: "https://github.com/test/test" });
    const request = new Request("http://localhost/api/skills/sync-repo", {
      method: "POST",
      body: payload,
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Server configuration error");
  });

  // Note: Mocking different env values in the same file with bun:test is tricky because modules are cached.
  // Ideally we would have separate test files or use a more sophisticated mocking strategy.
  // For this task, verifying the "missing token" case is sufficient as it covers the vulnerability fix.
});
