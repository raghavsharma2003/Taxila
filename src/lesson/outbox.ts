// The outbox (PRODUCT-DESIGN-V2 §4.7, grafted from CFW): no answer is ever lost. Every child turn is written to
// IndexedDB, keyed (lessonId, turnSeq), BEFORE its request is sent; it is removed only when the server answers
// that turn. Automatic retries at 1 s, 3 s and 6 s, then the trouble state. On reconnect the queue flushes in
// order. EVERY attempt carries its `turnSeq` (so the server can dedupe a retry against the first attempt on
// (lessonId, turnSeq): an open item for the lesson route's owner); every attempt after the first also carries
// `retried: true`, so evidence from it can be marked.
// turnSeq is per lesson and seeded from the store (reserve()): a reloaded page never reuses a held record's key.
// Records of OTHER lessons (a session that expired, a reload, "Finish for now") stay in the store and are listed
// by lessons(), so the runtime can flush them after sign-in.
// Which failures retry automatically: no HTTP answer at all (offline, DNS, reset: fetch throws), the attempt's
// deadline (the request hung: aborted, then retried, marked retried) and the gateway statuses 408/429/502/503/504,
// which mean the turn was not processed. A 500 or 409 is NOT retried on its own: the server writes the turn's
// rows before its optimistic state check, so a blind resend could count the same answer twice (see runtime.ts).
// Those wait for the child's "Send again", marked retried.
// kick() abandons the attempt in flight (or the wait before the next one) and retries at once ("Try again" on
// T1); edit() replaces the words of a turn still in flight and re-sends it under the same turnSeq, marked
// edited ("Fix" on a misheard transcript, §4.3), so the edit never counts as a second answer.
// If IndexedDB is unavailable (private window, blocked storage) the outbox falls back to memory and says so
// (`durable === false`), which the lesson card notes.
import type { TurnRequest } from "../../shared/contracts.ts";
import { Emitter } from "./store.ts";
import { realTimers, type Timers } from "./timers.ts";

export const RETRY_SCHEDULE_MS = [1000, 3000, 6000] as const;
/** One attempt may take this long before it is aborted and retried: the server's worst turn (classify 7 s, then up
 *  to two 6 s replies) plus margin. T1 shows at 8 s, long before this; "Try again" on T1 does not wait for it. */
export const ATTEMPT_DEADLINE_MS = 25_000;

export type OutboxStatus = "queued" | "inflight" | "failed";
export interface OutboxRecord {
  key: string;
  lessonId: string;
  turnSeq: number;
  req: TurnRequest & { turnSeq?: number; retried?: boolean; edited?: boolean };
  at: number;
  attempts: number;
  status: OutboxStatus;
}

export interface OutboxStore {
  put(r: OutboxRecord): Promise<void>;
  delete(key: string): Promise<void>;
  list(lessonId: string): Promise<OutboxRecord[]>;
  /** Every record of every lesson (the cross-lesson flush after sign-in or a reload). */
  all(): Promise<OutboxRecord[]>;
  readonly durable: boolean;
}

export type OutboxEvent =
  | { type: "written"; rec: OutboxRecord }
  | { type: "attempt"; rec: OutboxRecord }
  | { type: "retry"; rec: OutboxRecord; inMs: number; error: unknown }
  | { type: "acked"; rec: OutboxRecord; retried: boolean }
  | { type: "exhausted"; rec: OutboxRecord; error: unknown }
  | { type: "rejected"; rec: OutboxRecord; error: unknown };

/** A send that ran out of automatic retries (or was not retryable); the record is still in the outbox. */
export class OutboxHeld extends Error {
  readonly rec: OutboxRecord;
  readonly cause: unknown;
  readonly retryable: boolean;
  constructor(rec: OutboxRecord, cause: unknown, retryable: boolean) {
    super(cause instanceof Error ? cause.message : String(cause));
    this.rec = rec;
    this.cause = cause;
    this.retryable = retryable;
  }
}

export function isRetryable(err: unknown): boolean {
  const status = (err as { status?: unknown } | null)?.status;
  if (typeof status === "number") return status === 0 || status === 408 || status === 429 || status === 502 || status === 503 || status === 504;
  // fetch() rejects with a TypeError when no HTTP answer arrived (offline, DNS, connection reset); an attempt that
  // hung past its deadline (or was abandoned by "Try again") is aborted.
  const name = (err as { name?: string } | null)?.name;
  return err instanceof TypeError || name === "TypeError" || name === "NetworkError" || name === "AbortError" || name === "TimeoutError";
}

/** The attempt's deadline passed (the request hung). Retryable. */
export class AttemptTimeout extends Error {
  override readonly name = "TimeoutError";
  constructor(ms: number) {
    super(`no answer in ${ms} ms`);
  }
}

// ───────────── stores ─────────────

export class MemoryOutboxStore implements OutboxStore {
  readonly durable: boolean;
  private rows = new Map<string, OutboxRecord>();
  constructor(durable = false) {
    this.durable = durable;
  }
  async put(r: OutboxRecord) {
    this.rows.set(r.key, structuredClone(r));
  }
  async delete(key: string) {
    this.rows.delete(key);
  }
  async list(lessonId: string) {
    return [...this.rows.values()].filter((r) => r.lessonId === lessonId).sort((a, b) => a.turnSeq - b.turnSeq).map((r) => structuredClone(r));
  }
  async all() {
    return [...this.rows.values()].sort((a, b) => a.at - b.at || a.turnSeq - b.turnSeq).map((r) => structuredClone(r));
  }
}

const DB = "taxila-outbox";
const OS = "turns";

export class IdbOutboxStore implements OutboxStore {
  readonly durable = true;
  private db: Promise<IDBDatabase>;
  constructor(idb: IDBFactory) {
    this.db = new Promise((resolve, reject) => {
      const req = idb.open(DB, 1);
      req.onupgradeneeded = () => {
        const os = req.result.createObjectStore(OS, { keyPath: "key" });
        os.createIndex("lesson", "lessonId");
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error("outbox database blocked"));
    });
  }
  private async tx<T>(mode: IDBTransactionMode, fn: (os: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await this.db;
    return new Promise<T>((resolve, reject) => {
      const t = db.transaction(OS, mode);
      const r = fn(t.objectStore(OS));
      t.oncomplete = () => resolve(r.result);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    });
  }
  async put(r: OutboxRecord) {
    await this.tx("readwrite", (os) => os.put(r));
  }
  async delete(key: string) {
    await this.tx("readwrite", (os) => os.delete(key));
  }
  async list(lessonId: string) {
    const rows = await this.tx<OutboxRecord[]>("readonly", (os) => os.index("lesson").getAll(lessonId));
    return rows.sort((a, b) => a.turnSeq - b.turnSeq);
  }
  async all() {
    const rows = await this.tx<OutboxRecord[]>("readonly", (os) => os.getAll());
    return rows.sort((a, b) => a.at - b.at || a.turnSeq - b.turnSeq);
  }
  /** Probe: open succeeds (a private window or blocked storage rejects). */
  ready(): Promise<boolean> {
    return this.db.then(() => true, () => false);
  }
}

/** IndexedDB when it opens, else memory (durable: false). Resolves once, at lesson start. */
export async function openOutboxStore(): Promise<OutboxStore> {
  try {
    const idb = (globalThis as { indexedDB?: IDBFactory }).indexedDB;
    if (idb) {
      const s = new IdbOutboxStore(idb);
      if (await s.ready()) return s;
    }
  } catch {
    /* storage blocked */
  }
  return new MemoryOutboxStore(false);
}

// ───────────── the queue ─────────────

export interface OutboxDeps {
  store: OutboxStore;
  timers?: Timers;
  now?: () => number;
  schedule?: readonly number[];
  /** navigator.onLine (exposed as isOnline for the UI's "Still offline" feedback). */
  online?: () => boolean;
  /** Per-attempt deadline (default ATTEMPT_DEADLINE_MS). */
  deadlineMs?: number;
}

/** What a send function receives: the wire request and the attempt's abort signal (deadline, kick, edit). */
export type SendFn<R> = (req: TurnRequest, signal: AbortSignal) => Promise<R>;

interface Active { rec: OutboxRecord; abort: (why: "kick" | "edit") => void; wake: (() => void) | null }

export class Outbox {
  readonly events = new Emitter<OutboxEvent>();
  private store: OutboxStore;
  private readonly timers: Timers;
  private readonly now: () => number;
  private readonly schedule: readonly number[];
  private readonly online: () => boolean;
  private readonly deadlineMs: number;
  /** The highest turnSeq handed out per lesson (seeded from the store by reserve()). */
  private seqs = new Map<string, number>();
  /** Lessons whose turnSeq was seeded from the store on this page (reserve() reads the store once per lesson). */
  private seeded = new Set<string>();
  private active = new Map<string, Active>();

  constructor(d: OutboxDeps) {
    this.store = d.store;
    this.timers = d.timers ?? realTimers;
    this.now = d.now ?? (() => Date.now());
    this.schedule = d.schedule ?? RETRY_SCHEDULE_MS;
    this.online = d.online ?? (() => (typeof navigator === "undefined" ? true : navigator.onLine !== false));
    this.deadlineMs = d.deadlineMs ?? ATTEMPT_DEADLINE_MS;
  }

  get durable(): boolean {
    return this.store.durable;
  }

  /** Swap the backing store (memory at construction, IndexedDB once it opens); carries every row over. */
  async useStore(next: OutboxStore): Promise<void> {
    const prev = this.store;
    this.store = next;
    for (const r of await prev.all().catch(() => [] as OutboxRecord[])) await next.put(r);
  }

  /** The next turnSeq for a lesson: above anything this outbox handed out AND anything held in the store, so a
   *  reloaded page (a new Outbox, seq back at 0) never overwrites a held record of the same lesson. */
  async reserve(lessonId: string): Promise<number> {
    // r4-latency: the store is read once per lesson per page (the seed), not on every turn. Every record written after
    // it went through this outbox, so seqs already covers it. Each IndexedDB round trip before the turn's fetch waits
    // behind the page's frame work (measured: 56-123 ms long tasks back to back with the puppet on).
    const stored = this.seeded.has(lessonId) ? [] : await this.store.list(lessonId).then((r) => (this.seeded.add(lessonId), r), () => [] as OutboxRecord[]);
    const top = Math.max(this.seqs.get(lessonId) ?? 0, ...stored.map((r) => r.turnSeq));
    const n = top + 1;
    this.seqs.set(lessonId, n);
    return n;
  }

  /**
   * Write, then send with the automatic retry schedule. Resolves with the server's answer (the record is gone);
   * rejects with OutboxHeld when the turn could not be delivered (the record stays, status "failed").
   */
  async send<R>(req: TurnRequest, sendFn: SendFn<R>, opts: { turnSeq?: number; retried?: boolean } = {}): Promise<R> {
    const turnSeq = opts.turnSeq ?? (await this.reserve(req.lessonId));
    if (turnSeq > (this.seqs.get(req.lessonId) ?? 0)) this.seqs.set(req.lessonId, turnSeq);
    const rec: OutboxRecord = {
      key: `${req.lessonId}:${turnSeq}`, lessonId: req.lessonId, turnSeq,
      // Every attempt carries turnSeq (the server's dedupe key); a resend adds retried: true.
      req: { ...req, turnSeq, ...(opts.retried ? { retried: true } : {}) }, at: this.now(), attempts: 0, status: "queued",
    };
    // The write comes FIRST: a crash, a reload or a dead network after this line cannot lose the answer.
    try {
      await this.store.put(rec);
    } catch {
      await this.useStore(new MemoryOutboxStore(false));
      await this.store.put(rec);
    }
    this.events.emit({ type: "written", rec });
    return this.deliver(rec, sendFn);
  }

  /** Re-send one held record now (the child's "Send again" / "Try again", the reconnect flush, or the
   *  cross-lesson flush after sign-in). */
  async resend<R>(key: string, lessonId: string, sendFn: SendFn<R>): Promise<R> {
    const rec = (await this.store.list(lessonId)).find((r) => r.key === key);
    if (!rec) throw new Error("not in the outbox");
    if (this.active.has(key)) throw new Error("already in flight");
    rec.req = { ...rec.req, turnSeq: rec.turnSeq, retried: true };
    return this.deliver(rec, sendFn, true);
  }

  /** Everything still held for a lesson, oldest first. */
  pending(lessonId: string): Promise<OutboxRecord[]> {
    return this.store.list(lessonId);
  }

  /** Lessons with records still held, other than `except` (the cross-lesson flush). */
  async lessons(except?: string | null): Promise<string[]> {
    const ids = new Set<string>();
    for (const r of await this.store.all().catch(() => [] as OutboxRecord[])) if (r.lessonId !== except) ids.add(r.lessonId);
    return [...ids];
  }

  /** Is a record being delivered right now (an attempt in flight, or waiting for its next retry)? */
  get inFlight(): OutboxRecord | null {
    return [...this.active.values()].at(-1)?.rec ?? null;
  }

  /**
   * "Try again": abandon the attempt in flight (or the wait before the next retry) and send again at once, marked
   * retried. Returns false when nothing is being delivered (then the caller resends what is held).
   */
  kick(): boolean {
    const a = [...this.active.values()].at(-1);
    if (!a) return false;
    a.abort("kick");
    return true;
  }

  /**
   * "Fix": the child corrected a misheard transcript before she replied. The turn in flight is abandoned and
   * re-sent with the corrected words under the SAME turnSeq, marked edited (+ retried), so the server can
   * supersede the first attempt rather than count two answers. Returns false when no turn is in flight (then
   * the fix is an ordinary new answer).
   */
  async edit(childText: string): Promise<boolean> {
    const a = [...this.active.values()].at(-1);
    if (!a) return false;
    a.rec.req = { ...a.rec.req, childText, turnSeq: a.rec.turnSeq, edited: true, retried: true };
    await this.store.put(a.rec).catch(() => {});
    a.abort("edit");
    return true;
  }

  private async deliver<R>(rec: OutboxRecord, sendFn: SendFn<R>, manual = false): Promise<R> {
    let lastErr: unknown = null;
    let i = 0;
    const flag: { why: "kick" | "edit" | null } = { why: null };
    let ctrl: AbortController | null = null;
    const act: Active = {
      rec,
      wake: null,
      abort: (why) => {
        flag.why = why;
        ctrl?.abort(new DOMException(why, "AbortError"));
        act.wake?.();
      },
    };
    this.active.set(rec.key, act);
    try {
      while (i <= this.schedule.length) {
        rec.attempts++;
        rec.status = "inflight";
        // r4-latency: the record is already durable (written "queued" in send()); this status write goes out WITH the
        // request instead of before it (one IndexedDB round trip less before the fetch), and is awaited before the
        // record is deleted, so a late status write can never bring an acknowledged turn back.
        const marked = this.store.put(rec).catch(() => {});
        this.events.emit({ type: "attempt", rec });
        flag.why = null;
        const c = (ctrl = new AbortController());
        const deadline = this.timers.setTimeout(() => c.abort(new AttemptTimeout(this.deadlineMs)), this.deadlineMs);
        try {
          // The race makes the deadline and "Try again" hold even for a send function that ignores its signal.
          const res = await new Promise<R>((resolve, reject) => {
            if (c.signal.aborted) return reject(c.signal.reason);
            c.signal.addEventListener("abort", () => reject(c.signal.reason), { once: true });
            sendFn(rec.req, c.signal).then(resolve, reject);
          });
          this.timers.clearTimeout(deadline);
          await marked;
          await this.store.delete(rec.key).catch(() => {});
          this.events.emit({ type: "acked", rec, retried: rec.attempts > 1 || manual || !!rec.req.retried });
          return res;
        } catch (err) {
          this.timers.clearTimeout(deadline);
          await marked; // the status writes below land after it, in order
          lastErr = err;
          // From now on this is a resend of the same turn.
          rec.req = { ...rec.req, turnSeq: rec.turnSeq, retried: true };
          if (flag.why) {
            // Kicked or edited: send again now, without spending the retry schedule.
            rec.status = "queued";
            await this.store.put(rec).catch(() => {});
            this.events.emit({ type: "retry", rec, inMs: 0, error: err });
            continue;
          }
          if (!isRetryable(err)) {
            rec.status = "failed";
            await this.store.put(rec).catch(() => {});
            this.events.emit({ type: "rejected", rec, error: err });
            throw new OutboxHeld(rec, err, false);
          }
          if (i === this.schedule.length) break;
          const inMs = this.schedule[i++];
          rec.status = "queued";
          await this.store.put(rec).catch(() => {});
          this.events.emit({ type: "retry", rec, inMs, error: err });
          await new Promise<void>((r) => {
            const h = this.timers.setTimeout(() => {
              act.wake = null;
              r();
            }, inMs);
            act.wake = () => {
              this.timers.clearTimeout(h);
              act.wake = null;
              r();
            };
          });
        }
      }
      rec.status = "failed";
      await this.store.put(rec).catch(() => {});
      this.events.emit({ type: "exhausted", rec, error: lastErr });
      throw new OutboxHeld(rec, lastErr, true);
    } finally {
      if (this.active.get(rec.key) === act) this.active.delete(rec.key);
    }
  }

  /** Remove a record the server can never accept (the lesson was closed elsewhere). */
  async drop(key: string): Promise<void> {
    await this.store.delete(key).catch(() => {});
  }

  /** Remove every record of a lesson (the server says it is closed, or the records are too old to matter). */
  async dropLesson(lessonId: string): Promise<void> {
    for (const r of await this.store.list(lessonId).catch(() => [] as OutboxRecord[])) await this.store.delete(r.key).catch(() => {});
  }

  /** The held copy loses its module events: the runtime re-buffers them for the next call (sent exactly once). */
  async withoutModuleEvents(rec: OutboxRecord): Promise<void> {
    if (!rec.req.moduleEvents && rec.req.droppedEvents === undefined) return;
    const req = { ...rec.req };
    delete req.moduleEvents;
    delete req.droppedEvents;
    rec.req = req;
    await this.store.put(rec).catch(() => {});
  }

  /** Is anything still held for this lesson? */
  async hasPending(lessonId: string): Promise<boolean> {
    return (await this.store.list(lessonId)).length > 0;
  }

  get isOnline(): boolean {
    return this.online();
  }
}
