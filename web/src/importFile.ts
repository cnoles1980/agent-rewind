import { MAX_BYTES, type Tape } from "./engine";
import type { ImportSource } from "./imports";

export type ImportProgress = { phase: string; percent: number | null };

export function importLocalFile(
  file: File,
  source: ImportSource,
  signal: AbortSignal,
  onProgress: (progress: ImportProgress) => void,
): Promise<Tape> {
  if (file.size > MAX_BYTES)
    return Promise.reject(
      new Error(
        `This recording is ${(file.size / 1024 / 1024).toFixed(1)} MB. Local imports support up to 100 MB and 10,000 events. Export a smaller session or a reviewed clip.`,
      ),
    );
  if (signal.aborted)
    return Promise.reject(new DOMException("Import cancelled", "AbortError"));
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./import.worker.ts", import.meta.url), {
      type: "module",
    });
    let settled = false;
    const cleanup = () => {
      settled = true;
      worker.terminate();
      signal.removeEventListener("abort", cancel);
    };
    const cancel = () => {
      if (!settled) {
        cleanup();
        reject(new DOMException("Import cancelled", "AbortError"));
      }
    };
    signal.addEventListener("abort", cancel, { once: true });
    worker.onmessage = ({ data }) => {
      if (settled) return;
      if (data.type === "progress")
        onProgress({ phase: data.phase, percent: data.percent });
      else if (data.type === "complete") {
        cleanup();
        resolve(data.tape as Tape);
      } else if (data.type === "error") {
        cleanup();
        reject(new Error(data.message));
      }
    };
    worker.onerror = (event) => {
      event.preventDefault();
      if (!settled) {
        cleanup();
        reject(
          new Error(
            "The background importer stopped unexpectedly. Retry the file; if it repeats, try a smaller session.",
          ),
        );
      }
    };
    worker.onmessageerror = () => {
      if (!settled) {
        cleanup();
        reject(
          new Error(
            "The browser could not transfer the imported recording. Try a smaller session.",
          ),
        );
      }
    };
    try {
      worker.postMessage({ file, source });
    } catch (e) {
      cleanup();
      reject(e);
    }
  });
}
