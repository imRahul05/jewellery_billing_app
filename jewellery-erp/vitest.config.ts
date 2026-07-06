import "dotenv/config";
import { defineConfig, configDefaults } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    exclude: [...configDefaults.exclude, "tests/e2e/**"],
    alias: {
      "@": path.resolve(__dirname, "./"),
      "server-only": path.resolve(__dirname, "./tests/mocks/server-only.ts"),
      "next/headers": path.resolve(__dirname, "./tests/mocks/next-headers.ts"),
    },
  },
  ssr: {
    noExternal: ["@neondatabase/auth"],
  },
});
