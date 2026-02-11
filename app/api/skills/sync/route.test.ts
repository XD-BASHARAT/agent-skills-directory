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

// Mock lib/features/skills/github-rest
mock.module("@/lib/features/skills/github-rest", () => ({
  searchSkills: () => Promise.resolve({
    skills: [],
    total: 0
  })
}));

// Mock lib/db/queries
mock.module("@/lib/db/queries", () => ({
  batchUpsertSkills: () => Promise.resolve({ inserted: 0 })
}));

// Mock lib/utils
mock.module("@/lib/utils", () => ({
  slugify: (str: string) => str.toLowerCase().replace(/ /g, "-")
}));

// Mock lib/env
mock.module("@/lib/env", () => ({
  env: {
    SYNC_SECRET_TOKEN: undefined
  }
}));

describe("Sync All Auth", () => {
  it("should fail closed (500) if SYNC_SECRET_TOKEN is missing", async () => {
    // Re-import route to apply mock
    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/skills/sync", {
      method: "POST",
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Server configuration error");
  });
});
