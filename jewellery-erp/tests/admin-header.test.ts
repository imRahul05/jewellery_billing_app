import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("admin header user menu", () => {
  test("the admin layout renders the interactive user menu", () => {
    const layout = source("../app/admin/layout.tsx");

    expect(layout).toContain('import { AdminUserMenu } from "@/components/admin/admin-user-menu"');
    expect(layout).toContain("<AdminUserMenu userName={user.fullName || user.email} />");
  });

  test("logout clears auth before redirecting and refreshing routing", () => {
    const menu = source("../components/admin/admin-user-menu.tsx");
    const signOut = menu.indexOf("await authClient.signOut()");
    const redirect = menu.indexOf('router.push("/login")');
    const refresh = menu.indexOf("router.refresh()");

    expect(menu).toContain("<DropdownMenuLabel>{userName}</DropdownMenuLabel>");
    expect(menu).toContain("Log out");
    expect(signOut).toBeGreaterThan(-1);
    expect(redirect).toBeGreaterThan(signOut);
    expect(refresh).toBeGreaterThan(redirect);
  });
});
