import { DurableObject } from "cloudflare:workers";
import { equalHash, type Role, type AccessRole } from "./common";

type Session = { role: AccessRole; expires: number; invitation?: string };

// One object per session or hashed login IP. Public page traffic never touches this state.
export class AccessState extends DurableObject<Env> {
  async create(role: AccessRole, invitation?: string) {
    await this.ctx.storage.put("session", {
      role,
      expires: Date.now() + 7 * 86400_000,
      ...(invitation ? { invitation } : {}),
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
// Feedback is explicitly submitted text; no tapes, analysis output or credentials are stored.
export class BudgetLedger extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS baseline(role TEXT PRIMARY KEY, cents INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS analyses(owner TEXT, idem TEXT, role TEXT, status TEXT, created INTEGER, usage TEXT, PRIMARY KEY(owner,idem));
      CREATE TABLE IF NOT EXISTS clips(token TEXT PRIMARY KEY, owner TEXT, size INTEGER);
      CREATE INDEX IF NOT EXISTS clips_owner ON clips(owner);
      CREATE TABLE IF NOT EXISTS study_invites(id TEXT PRIMARY KEY, hash TEXT UNIQUE NOT NULL, label TEXT NOT NULL, revoked INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE IF NOT EXISTS study_admissions(owner TEXT, idem TEXT, invitation TEXT NOT NULL, PRIMARY KEY(owner,idem));
      CREATE TABLE IF NOT EXISTS study_feedback(id TEXT PRIMARY KEY, invitation TEXT NOT NULL, created INTEGER NOT NULL, rating INTEGER NOT NULL, message TEXT NOT NULL, deleted INTEGER NOT NULL DEFAULT 0);
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
  reserve(owner: string, role: Role, idem: string, invitation?: string) {
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
      if (invitation) {
        if (role !== "tester" || !this.studyInvitation(invitation))
          return "This tester invitation has been revoked.";
        if (this.studyUsed() >= 20)
          return "The testing group's $5 allowance is used. Replay and feedback still work.";
      }
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
      if (invitation)
        sql.exec(
          "INSERT INTO study_admissions VALUES(?,?,?)",
          owner,
          idem,
          invitation,
        );
      return null;
    });
  }
  studyUsed(): number {
    return this.ctx.storage.sql
      .exec<{ n: number }>("SELECT COUNT(*) n FROM study_admissions")
      .one().n;
  }
  studyInvitation(id: string) {
    return (
      this.ctx.storage.sql
        .exec<{ id: string; label: string }>(
          "SELECT id,label FROM study_invites WHERE id=? AND revoked=0",
          id,
        )
        .toArray()[0] ?? null
    );
  }
  studyLogin(hash: string) {
    return (
      this.ctx.storage.sql
        .exec<{ id: string }>(
          "SELECT id FROM study_invites WHERE hash=? AND revoked=0",
          hash,
        )
        .toArray()[0]?.id ?? null
    );
  }
  studyStatus(invitation: string) {
    const record = this.studyInvitation(invitation);
    if (!record) return null;
    const budget = this.budget();
    const remaining = Math.max(
      0,
      Math.min(
        20 - this.studyUsed(),
        Math.floor((2000 - budget.tester) / 25),
        Math.floor((10000 - 3000 - budget.tester - budget.judge) / 25),
      ),
    );
    return {
      label: record.label,
      remaining_calls: remaining,
      group_limit_cents: 500,
      group_reserved_cents: this.studyUsed() * 25,
    };
  }
  createStudyInvitation(id: string, hash: string, label: string) {
    return this.ctx.storage.transactionSync(() => {
      const count = this.ctx.storage.sql
        .exec<{ n: number }>("SELECT COUNT(*) n FROM study_invites")
        .one().n;
      if (count >= 10) return false;
      this.ctx.storage.sql.exec(
        "INSERT INTO study_invites(id,hash,label) VALUES(?,?,?)",
        id,
        hash,
        label,
      );
      return true;
    });
  }
  revokeStudyInvitation(id: string) {
    this.ctx.storage.sql.exec(
      "UPDATE study_invites SET revoked=1 WHERE id=?",
      id,
    );
  }
  studyOverview() {
    return {
      group_limit_cents: 500,
      group_reserved_cents: this.studyUsed() * 25,
      invitations: this.ctx.storage.sql
        .exec<{ id: string; label: string; revoked: number; calls: number }>(
          "SELECT i.id,i.label,i.revoked,(SELECT COUNT(*) FROM study_admissions a WHERE a.invitation=i.id) calls FROM study_invites i ORDER BY i.rowid",
        )
        .toArray(),
      feedback: this.ctx.storage.sql
        .exec<{
          id: string;
          label: string;
          created: number;
          rating: number;
          message: string;
        }>(
          "SELECT f.id,i.label,f.created,f.rating,f.message FROM study_feedback f JOIN study_invites i ON i.id=f.invitation WHERE f.deleted=0 ORDER BY f.created DESC LIMIT 100",
        )
        .toArray(),
    };
  }
  submitStudyFeedback(
    id: string,
    invitation: string,
    rating: number,
    message: string,
  ) {
    return this.ctx.storage.transactionSync(() => {
      if (!this.studyInvitation(invitation)) return "revoked";
      const prior = this.ctx.storage.sql
        .exec<{ invitation: string; deleted: number }>(
          "SELECT invitation,deleted FROM study_feedback WHERE id=?",
          id,
        )
        .toArray()[0];
      if (prior)
        return prior.invitation === invitation && !prior.deleted
          ? "saved"
          : "conflict";
      const count = this.ctx.storage.sql
        .exec<{ n: number }>(
          "SELECT COUNT(*) n FROM study_feedback WHERE invitation=?",
          invitation,
        )
        .one().n;
      if (count >= 10) return "full";
      this.ctx.storage.sql.exec(
        "INSERT INTO study_feedback(id,invitation,created,rating,message) VALUES(?,?,?,?,?)",
        id,
        invitation,
        Date.now(),
        rating,
        message,
      );
      return "saved";
    });
  }
  deleteStudyFeedback(id: string) {
    // Retain only the receipt so deletion cannot reset quota or replay deleted content.
    this.ctx.storage.sql.exec(
      "UPDATE study_feedback SET deleted=1,message='',rating=0 WHERE id=?",
      id,
    );
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
