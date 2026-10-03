import { openDB } from "idb";
import type { Tape } from "./engine";
const db = openDB("agent-rewind", 1, {
  upgrade(db) {
    db.createObjectStore("tapes", { keyPath: "run.id" });
    db.createObjectStore("shares", { keyPath: "token" });
  },
});
export async function listTapes(): Promise<Tape[]> {
  return (await db).getAll("tapes");
}
export async function saveTape(t: Tape) {
  await (await db).put("tapes", t);
}
export async function removeTape(id: string) {
  await (await db).delete("tapes", id);
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
