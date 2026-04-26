import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
  test: {
    environment: "node",
    include: [
      "packages/**/*.test.ts",
      "packages/**/*.test.tsx",
      "apps/**/*.test.ts",
      "apps/**/*.test.tsx",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
    },
  },
  resolve: {
    alias: {
      "@poi/sdk": resolve(root, "packages/sdk/src/index.ts"),
      "@poi/agent-runtime": resolve(
        root,
        "packages/agent-runtime/src/index.ts",
      ),
      "@poi/ui": resolve(root, "packages/ui/src/index.tsx"),
    },
  },
});
