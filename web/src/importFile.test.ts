import { it, expect } from "vitest";
import { importLocalFile } from "./importFile";
import { MAX_BYTES } from "./engine";

it("rejects an oversized file before reading it or starting a worker", async () => {
  const file = { size: MAX_BYTES + 1 } as File;
  await expect(
    importLocalFile(file, "auto", new AbortController().signal, () => {}),
  ).rejects.toThrow("100 MB and 10,000 events");
});

it("does not start a worker for an already cancelled import", async () => {
  const controller = new AbortController();
  controller.abort();
  await expect(
    importLocalFile({ size: 1 } as File, "auto", controller.signal, () => {}),
  ).rejects.toThrow("Import cancelled");
});
