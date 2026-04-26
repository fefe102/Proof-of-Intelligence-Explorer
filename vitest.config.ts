import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    include: ["packages/**/*.test.ts", "apps/**/*.test.ts", "contracts/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"]
    }
  },
  resolve: {
    alias: {
      "@poi/sdk": "<workspace>/packages/sdk/src/index.ts",
      "@poi/agent-runtime": "<workspace>/packages/agent-runtime/src/index.ts",
      "@poi/ui": "<workspace>/packages/ui/src/index.ts"
    }
  }
});
