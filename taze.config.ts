import { defineConfig } from "taze";

export default defineConfig({
  // Allow major version bumps
  mode: "major",
  // Match minimumReleaseAge: 1440 (24h) from pnpm-workspace.yaml
  maturityPeriod: 1,
  // Don't auto-install — user runs `pnpm i` separately
  install: false,
  // Ignore common non-package paths
  ignorePaths: ["**/node_modules/**", "**/dist/**"],
  // Only these fields get bumped (skip overrides)
  depFields: {
    overrides: false,
  },
});
