import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://127.0.0.1:5173",
    viewport: { width: 1448, height: 1086 },
    // Other workflows start as returning visitors; tutorial.spec tests fresh visits.
    storageState: {
      cookies: [],
      origins: ["http://127.0.0.1:5173", "http://127.0.0.1:8766"].map(
        (origin) => ({
          origin,
          localStorage: [{ name: "rewind.welcome.seen.v1", value: "true" }],
        }),
      ),
    },
  },
  workers: 1,
  webServer: [
    {
      command: "uv run python scripts/serve_browser_tests.py",
      cwd: "..",
      url: "http://127.0.0.1:8766/api/health",
      reuseExistingServer: !process.env.CI,
    },
    {
      command:
        "uv run uvicorn agent_rewind.api:app --host 127.0.0.1 --port 8765",
      cwd: "..",
      url: "http://127.0.0.1:8765/api/health",
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "npm run dev -- --host 127.0.0.1 --port 5173 --strictPort",
      url: "http://127.0.0.1:5173",
      reuseExistingServer: !process.env.CI,
    },
  ],
});
