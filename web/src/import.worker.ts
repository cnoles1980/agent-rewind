import { importRecording, type ImportSource } from "./imports";
import { MAX_BYTES } from "./engine";

// This module never makes a network request. Only sanitized tapes leave the worker.
self.onmessage = async ({
  data,
}: MessageEvent<{ file: File; source: ImportSource }>) => {
  try {
    if (data.file.size > MAX_BYTES)
      throw new Error(
        "Local recording exceeds 100 MB. Export a smaller session or a reviewed clip.",
      );
    self.postMessage({
      type: "progress",
      phase: "Reading file locally…",
      percent: 0,
    });
    const reader = data.file.stream().getReader();
    const decoder = new TextDecoder("utf-8", { fatal: true });
    const chunks: string[] = [];
    let bytes = 0,
      lastPercent = -1;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BYTES) throw new Error("Local recording exceeds 100 MB.");
      chunks.push(decoder.decode(value, { stream: true }));
      const percent = Math.floor((bytes / Math.max(data.file.size, 1)) * 100);
      if (percent !== lastPercent) {
        self.postMessage({
          type: "progress",
          phase: "Reading file locally…",
          percent,
        });
        lastPercent = percent;
      }
    }
    chunks.push(decoder.decode());
    self.postMessage({
      type: "progress",
      phase: "Converting and redacting…",
      percent: null,
    });
    const text = chunks.join("");
    chunks.length = 0;
    const tape = importRecording(text, data.source);
    self.postMessage({ type: "complete", tape });
  } catch (e) {
    self.postMessage({
      type: "error",
      message:
        e instanceof Error
          ? e.message
          : "Import failed. Check the selected file format.",
    });
  }
};
