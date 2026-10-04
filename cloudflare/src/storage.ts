import { DurableObject } from "cloudflare:workers";
import { equalHash, type Role } from "./common";

type Session = { role: Role; expires: number };

// One object per session or hashed login IP. Public page traffic never touches this state.
export class AccessState extends DurableObject<Env> {
  async create(role: Role) {
    await this.ctx.storage.put("session", {
      role,
      expires: Date.now() + 7 * 86400_000,
    });
    await this.ctx.storage.setAlarm(Date.now() + 7 * 86400_000);
  }
  async session() {
    const item = await this.ctx.storage.get<Session>("session");
    return item && item.expires > Date.now() ? item : null;
  }
  async revoke() {
    await this.ctx.storage.deleteAll();
  }
  async rate(limit: number, seconds: number) {
    return this.ctx.storage.transaction(async (txn) => {
      const now = Date.now();
      let item = await txn.get<{ count: number; reset: number }>("rate");
      if (!item || item.reset <= now)
        item = { count: 0, reset: now + seconds * 1000 };
      if (item.count >= limit) return false;
      await txn.put("rate", { ...item, count: item.count + 1 });
      if (!(await txn.get("session"))) await txn.setAlarm(item.reset);
      return true;
    });
  }
  async alarm() {
    await this.ctx.storage.deleteAll();
  }
}

// Only the shared cash budget and clip quotas require project-wide serialization.
// No evidence, analysis output, session secrets, or clip content enters this object.
export class BudgetLedger extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS baseline(role TEXT PRIMARY KEY, cents INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS analyses(owner TEXT, idem TEXT, role TEXT, status TEXT, created INTEGER, usage TEXT, PRIMARY KEY(owner,idem));
      CREATE TABLE IF NOT EXISTS clips(token TEXT PRIMARY KEY, owner TEXT, size INTEGER);
      CREATE INDEX IF NOT EXISTS clips_owner ON clips(owner);
    `);
    // A missing or malformed migration baseline fails closed, avoiding a budget reset.
    const tester = Number(env.INITIAL_TESTER_CENTS),
      judge = Number(env.INITIAL_JUDGE_CENTS);
    if (
      ![tester, judge].every((n) => Number.isSafeInteger(n) && n >= 0) ||
      !env.INITIAL_TESTER_CENTS ||
      !env.INITIAL_JUDGE_CENTS
    )
      throw new Error("Budget baseline is not configured");
    this.ctx.storage.sql.exec(
      "INSERT OR IGNORE INTO baseline VALUES('tester', ?), ('judge', ?)",
      tester,
      judge,
    );
  }
  budget(): Record<Role, number> {
    const result: Record<Role, number> = { tester: 0, judge: 0 };
    for (const row of this.ctx.storage.sql.exec<{ role: Role; cents: number }>(
      "SELECT role, cents FROM baseline UNION ALL SELECT role,COUNT(*)*25 FROM analyses GROUP BY role",
    ))
      result[row.role] += row.cents;
    return result;
  }
  reserve(owner: string, role: Role, idem: string) {
    return this.ctx.storage.transactionSync(() => {
      const sql = this.ctx.storage.sql;
      sql.exec(
        "UPDATE analyses SET status='interrupted' WHERE status='running' AND created < ?",
        Date.now() - 90_000,
      );
      if (
        sql
          .exec("SELECT 1 FROM analyses WHERE owner=? AND idem=?", owner, idem)
          .toArray().length
      )
        return "This analysis was already submitted. Review before starting a new request.";
      if (
        sql
          .exec("SELECT 1 FROM analyses WHERE status='running' LIMIT 1")
          .toArray().length
      )
        return "Another analysis is running. Try again shortly.";
      const budget = this.budget();
      if (budget[role] + 25 > (role === "judge" ? 3000 : 2000))
        return "Analysis budget reserved. Contact the project owner.";
      if (budget.tester + budget.judge + 3000 + 25 > 10000)
        return "Total $100 project budget reserved.";
      sql.exec(
        "INSERT INTO analyses VALUES(?,?,?,'running',?,NULL)",
        owner,
        idem,
        role,
        Date.now(),
      );
      return null;
    });
  }
  finish(
    owner: string,
    idem: string,
    status: "complete" | "failed",
    usage: Record<string, number> = {},
  ) {
    this.ctx.storage.sql.exec(
      "UPDATE analyses SET status=?,usage=? WHERE owner=? AND idem=?",
      status,
      JSON.stringify(usage),
      owner,
      idem,
    );
  }
  reserveClip(token: string, owner: string, size: number) {
    return this.ctx.storage.transactionSync(() => {
      const sql = this.ctx.storage.sql;
      const count = sql
        .exec<{ n: number }>(
          "SELECT COUNT(*) n FROM clips WHERE owner=?",
          owner,
        )
        .one().n;
      const used = sql
        .exec<{ n: number }>("SELECT COALESCE(SUM(size),0) n FROM clips")
        .one().n;
      if (count >= 50 || used + size > 128 * 1024 * 1024) return false;
      sql.exec("INSERT INTO clips VALUES(?,?,?)", token, owner, size);
      return true;
    });
  }
  releaseClip(token: string) {
    this.ctx.storage.sql.exec("DELETE FROM clips WHERE token=?", token);
  }
}

// One object per unguessable public clip. Chunking stays below storage value limits.
export class ClipStore extends DurableObject<Env> {
  async publish(tape: string, manageHash: string) {
    await this.ctx.storage.transaction(async (txn) => {
      if (await txn.get("manage")) throw new Error("Clip already exists");
      const pieces = [];
      for (let i = 0; i < tape.length; i += 32_000)
        pieces.push(tape.slice(i, i + 32_000));
      for (let i = 0; i < pieces.length; i++)
        await txn.put(`part:${i}`, pieces[i]);
      await txn.put({
        manage: manageHash,
        count: pieces.length,
        revoked: false,
      });
    });
  }
  async read() {
    return this.ctx.storage.transaction(async (txn) => {
      if (await txn.get("revoked")) return null;
      const count = await txn.get<number>("count");
      if (!count) return null;
      const parts = await txn.get<string>(
        Array.from({ length: count }, (_, i) => `part:${i}`),
      );
      return Array.from(
        { length: count },
        (_, i) => parts.get(`part:${i}`) ?? "",
      ).join("");
    });
  }
  async revoke(hash: string) {
    return this.ctx.storage.transaction(async (txn) => {
      if (!equalHash(hash, (await txn.get<string>("manage")) ?? ""))
        return false;
      const count = (await txn.get<number>("count")) ?? 0;
      for (let i = 0; i < count; i++) await txn.delete(`part:${i}`);
      // Keep a tombstone so retrying a revoke also releases a pending quota reservation.
      await txn.put({ revoked: true, count: 0 });
      return true;
    });
  }
}
