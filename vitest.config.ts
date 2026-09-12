import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    maxWorkers: 4,
    setupFiles: ["./vitest.setup.ts"],
    testTimeout: 30_000,
    include: ["test/**/*.test.ts", "test/**/*.test.tsx"],
  },
});
