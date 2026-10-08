import { openDB } from "idb";
import type { Tape } from "./engine";
import type { Result } from "./AnalysisResultView";
export type SavedAnalysis = {
  id: string;
  runId: string;
  createdAt: string;
  anchorId: string;
  anchorName: string;
  report: string;
  result: Result;
};
const db = openDB("agent-rewind", 2, {
  upgrade(db, oldVersion) {
    if (oldVersion < 1) {
      db.createObjectStore("tapes", { keyPath: "run.id" });
      db.createObjectStore("shares", { keyPath: "token" });
    }
    if (oldVersion < 2) {
      db.createObjectStore("analyses", { keyPath: "id" }).createIndex(
        "runId",
        "runId",
      );
    }
  },
  blocking() {
    void db.then((connection) => connection.close());
  },
  blocked() {
    window.dispatchEvent(new Event("rewind-storage-blocked"));
  },
});
export async function saveAnalysis(tape: Tape, analysis: SavedAnalysis) {
  const tx = (await db).transaction(["tapes", "analyses"], "readwrite");
  // Keep examples/hosted recordings available after reload without replacing
  // a local tape that may have newer notes than the analyzed snapshot.
  try {
    if (!(await tx.objectStore("tapes").get(tape.run.id))) {
      await tx.objectStore("tapes").put(tape);
    }
    await tx.objectStore("analyses").put(analysis);
    await tx.done;
  } catch (error) {
    try {
      tx.abort();
    } catch {
      /* Already completed/aborted. */
    }
    await tx.done.catch(() => {});
    throw error;
  }
}
export async function listAnalyses(runId: string): Promise<SavedAnalysis[]> {
  const rows = await (await db).getAllFromIndex("analyses", "runId", runId);
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export async function removeAnalysis(id: string) {
  await (await db).delete("analyses", id);
}
export async function listTapes(): Promise<Tape[]> {
  return (await db).getAll("tapes");
}
export async function saveTape(t: Tape) {
  await (await db).put("tapes", t);
}
export async function removeTape(id: string) {
  const tx = (await db).transaction(["tapes", "analyses"], "readwrite");
  const keys = await tx.objectStore("analyses").index("runId").getAllKeys(id);
  await Promise.all(keys.map((key) => tx.objectStore("analyses").delete(key)));
  await tx.objectStore("tapes").delete(id);
  await tx.done;
}
export type Share = {
  token: string;
  manage_token: string;
  url: string;
  name: string;
};
export async function saveShare(s: Share) {
  await (await db).put("shares", s);
}
export async function listShares(): Promise<Share[]> {
  return (await db).getAll("shares");
}
export async function removeShare(token: string) {
  await (await db).delete("shares", token);
}
