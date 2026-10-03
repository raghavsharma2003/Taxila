// The outbox (PRODUCT-DESIGN-V2 §4.7, grafted from CFW): no answer is ever lost. Every child turn is written to
// IndexedDB, keyed (lessonId, turnSeq), BEFORE its request is sent; it is removed only when the server answers
// that turn. Automatic retries at 1 s, 3 s and 6 s, then the trouble state. On reconnect the queue flushes in
// order. A resend carries `retried: true` and the same `turnSeq`, so evidence from it can be marked (and the
// server can dedupe on (lessonId, turnSeq): an open item for the lesson route's owner).
// Which failures retry automatically: no HTTP answer at all (offline, DNS, reset: fetch throws) and the gateway
// statuses 408/429/502/503/504, which mean the turn was not processed. A 500 or 409 is NOT retried on its own:
// the server writes the turn's rows before its optimistic state check, so a blind resend could count the same
// answer twice (see runtime.ts). Those wait for the child's "Send again", marked retried.
// If IndexedDB is unavailable (private window, blocked storage) the outbox falls back to memory and says so
// (`durable === false`), which the lesson card notes.
import type { TurnRequest } from "../../shared/contracts.ts";
import { Emitter } from "./store.ts";
import { realTimers, type Timers } from "./timers.ts";

export const RETRY_SCHEDULE_MS = [1000, 3000, 6000] as const;

export type OutboxStatus = "queued" | "inflight" | "failed";
export interface OutboxRecord {
  key: string;
  lessonId: string;
  turnSeq: number;
  req: TurnRequest & { turnSeq?: number; retried?: boolean };
  at: number;
  attempts: number;
  status: OutboxStatus;
}

export interface OutboxStore {
  put(r: OutboxRecord): Promise<void>;
  delete(key: string): Promise<void>;
  list(lessonId: string): Promise<OutboxRecord[]>;
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
  // fetch() rejects with a TypeError when no HTTP answer arrived (offline, DNS, connection reset).
  return err instanceof TypeError || (err as { name?: string } | null)?.name === "TypeError" || (err as { name?: string } | null)?.name === "NetworkError";
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
  /** navigator.onLine: while offline, retries wait for the "online" event instead of spending the schedule. */
  online?: () => boolean;
}

export class Outbox {
  readonly events = new Emitter<OutboxEvent>();
  private store: OutboxStore;
  private readonly timers: Timers;
  private readonly now: () => number;
  private readonly schedule: readonly number[];
  private readonly online: () => boolean;
  private seq = 0;

  constructor(d: OutboxDeps) {
    this.store = d.store;
    this.timers = d.timers ?? realTimers;
    this.now = d.now ?? (() => Date.now());
    this.schedule = d.schedule ?? RETRY_SCHEDULE_MS;
    this.online = d.online ?? (() => (typeof navigator === "undefined" ? true : navigator.onLine !== false));
  }

  get durable(): boolean {
    return this.store.durable;
  }

  /** Swap the backing store (memory at construction, IndexedDB once it opens); carries rows over. */
  async useStore(next: OutboxStore, lessonIds: string[] = []): Promise<void> {
    const prev = this.store;
    this.store = next;
    for (const id of lessonIds) for (const r of await prev.list(id)) await next.put(r);
  }

  nextSeq(): number {
    return ++this.seq;
  }

  /**
   * Write, then send with the automatic retry schedule. Resolves with the server's answer (the record is gone);
   * rejects with OutboxHeld when the turn could not be delivered (the record stays, status "failed").
   */
  async send<R>(req: TurnRequest, sendFn: (req: TurnRequest) => Promise<R>, opts: { turnSeq?: number; retried?: boolean } = {}): Promise<R> {
    const turnSeq = opts.turnSeq ?? this.nextSeq();
    const rec: OutboxRecord = {
      key: `${req.lessonId}:${turnSeq}`, lessonId: req.lessonId, turnSeq,
      // The wire request is unchanged on the first attempt; a resend adds { retried: true, turnSeq }.
      req: opts.retried ? { ...req, turnSeq, retried: true } : { ...req }, at: this.now(), attempts: 0, status: "queued",
    };
    // The write comes FIRST: a crash, a reload or a dead network after this line cannot lose the answer.
    try {
      await this.store.put(rec);
    } catch {
      await this.useStore(new MemoryOutboxStore(false), []);
      await this.store.put(rec);
    }
    this.events.emit({ type: "written", rec });
    return this.deliver(rec, sendFn);
  }

  /** Re-send one held record now (the child's "Send again" / "Try again", or the reconnect flush). */
  async resend<R>(key: string, lessonId: string, sendFn: (req: TurnRequest) => Promise<R>): Promise<R> {
    const rec = (await this.store.list(lessonId)).find((r) => r.key === key);
    if (!rec) throw new Error("not in the outbox");
    rec.req = { ...rec.req, turnSeq: rec.turnSeq, retried: true };
    return this.deliver(rec, sendFn, true);
  }

  /** Everything still held for a lesson, oldest first. */
  pending(lessonId: string): Promise<OutboxRecord[]> {
    return this.store.list(lessonId);
  }

  private async deliver<R>(rec: OutboxRecord, sendFn: (req: TurnRequest) => Promise<R>, manual = false): Promise<R> {
    let lastErr: unknown = null;
    for (let i = 0; i <= this.schedule.length; i++) {
      rec.attempts++;
      rec.status = "inflight";
      await this.store.put(rec).catch(() => {});
      this.events.emit({ type: "attempt", rec });
      try {
        const res = await sendFn(rec.req);
        await this.store.delete(rec.key).catch(() => {});
        this.events.emit({ type: "acked", rec, retried: rec.attempts > 1 || manual || !!rec.req.retried });
        return res;
      } catch (err) {
        lastErr = err;
        const retryable = isRetryable(err);
        if (!retryable) {
          rec.status = "failed";
          await this.store.put(rec).catch(() => {});
          this.events.emit({ type: "rejected", rec, error: err });
          throw new OutboxHeld(rec, err, false);
        }
        if (i === this.schedule.length) break;
        const inMs = this.schedule[i];
        rec.status = "queued";
        await this.store.put(rec).catch(() => {});
        this.events.emit({ type: "retry", rec, inMs, error: err });
        await new Promise<void>((r) => this.timers.setTimeout(r, inMs));
        // The retry carries the mark: from now on this is a resend of the same turn.
        rec.req = { ...rec.req, turnSeq: rec.turnSeq, retried: true };
      }
    }
    rec.status = "failed";
    await this.store.put(rec).catch(() => {});
    this.events.emit({ type: "exhausted", rec, error: lastErr });
    throw new OutboxHeld(rec, lastErr, true);
  }

  /** Remove a record the server can never accept (the lesson was closed elsewhere). */
  async drop(key: string): Promise<void> {
    await this.store.delete(key).catch(() => {});
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
