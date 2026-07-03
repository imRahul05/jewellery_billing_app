import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("authentication prerender boundaries", () => {
  test("the shared session resolver waits for a request before Neon Auth reads cookies", () => {
    const contents = source("../lib/auth/session.ts");
    const boundary = contents.indexOf("await connection()");
    const sessionRead = contents.indexOf("await auth.getSession()");

    expect(boundary).toBeGreaterThan(-1);
    expect(boundary).toBeLessThan(sessionRead);
  });

  test("the tenant-selection page waits for a request before Neon Auth reads cookies", () => {
    const contents = source("../app/(auth)/select-tenant/page.tsx");
    const boundary = contents.indexOf("await connection()");
    const sessionRead = contents.indexOf("await auth.getSession()");

    expect(boundary).toBeGreaterThan(-1);
    expect(boundary).toBeLessThan(sessionRead);
  });

  test("the prerenderable dashboard handler establishes its boundary outside error handling", () => {
    const contents = source("../app/api/v1/dashboard/route.ts");
    const boundary = contents.indexOf("await connection()");
    const errorBoundary = contents.indexOf("try {");

    expect(boundary).toBeGreaterThan(-1);
    expect(boundary).toBeLessThan(errorBoundary);
  });
});
