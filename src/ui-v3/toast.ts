// Toast policy (owner reset R9, DESIGN-V3 §6.9 and §12.3): the child never learns that things are being built.
// A toast may carry a real-world fact the child or parent must act on (offline, microphone, a saved change), never build,
// generation, grading, model or loading state. This is enforced by predicate here, not by instruction to callers: a message
// that trips the predicate is dropped before it can render, and counted so tests and the shot harness can assert 0.
// Erasable TypeScript, pure.

export type ToastKind = "saved" | "network" | "mic" | "info";

export interface ToastMsg {
  id: number;
  kind: ToastKind;
  text: string;
  /** Optional single action ("Undo", "Turn on"). */
  action?: { label: string; onAct: () => void };
  ttlMs: number;
}

/**
 * Words that describe the machinery. Matched on word starts, case-insensitive, so "builder", "generating", "loading",
 * "re-render" and "AI is thinking" all trip it. "Saved" / "offline" / "microphone" never do.
 */
const MACHINERY = /\b(build|built|generat|loading|load(ed|s)?\b|compil|deploy|render|pipeline|spinner|progress bar|making (this|that|it|you)|preparing|creating|in progress|please wait|wait(ing)? for|almost ready|getting ready|AI is|model|server|backend|api|timeout|timed out|error|fail|crash|bug|retry|try again later|something went wrong|oops|sorry,? (that|this|we))/i;

/** Copy rules that apply to every toast too (DESIGN-V3 §7): no exclamation chains, no emoji, ≤ 90 characters. */
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}]/u;

export type ToastVerdict = { ok: true } | { ok: false; why: "machinery" | "exclaim" | "emoji" | "too_long" | "empty" };

export function toastAllowed(text: string): ToastVerdict {
  const t = (text ?? "").trim();
  if (!t) return { ok: false, why: "empty" };
  if (MACHINERY.test(t)) return { ok: false, why: "machinery" };
  if (/!{2,}/.test(t) || (t.match(/!/g)?.length ?? 0) > 1) return { ok: false, why: "exclaim" };
  if (EMOJI.test(t)) return { ok: false, why: "emoji" };
  if (t.length > 90) return { ok: false, why: "too_long" };
  return { ok: true };
}

/** A tiny store so any component can push and the region renders; no React import keeps it testable in node. */
type Listener = (list: ToastMsg[]) => void;
let list: ToastMsg[] = [];
let nextId = 1;
let blocked = 0;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((l) => l(list));

export const DEFAULT_TTL: Record<ToastKind, number> = { saved: 3200, info: 3600, network: 0, mic: 0 };

/** Push a toast. Returns its id, or 0 if the policy dropped it. network/mic toasts stay until dismissed (ttl 0). */
export function pushToast(kind: ToastKind, text: string, action?: ToastMsg["action"]): number {
  if (!toastAllowed(text).ok) {
    blocked++;
    return 0;
  }
  // One toast per kind: a newer network state replaces the older one instead of stacking.
  list = list.filter((m) => m.kind !== kind || kind === "saved");
  const msg: ToastMsg = { id: nextId++, kind, text: text.trim(), action, ttlMs: DEFAULT_TTL[kind] };
  list = [...list.slice(-2), msg];
  emit();
  return msg.id;
}

export function dismissToast(id: number): void {
  const before = list.length;
  list = list.filter((m) => m.id !== id);
  if (list.length !== before) emit();
}

export function subscribeToasts(l: Listener): () => void {
  listeners.add(l);
  l(list);
  return () => listeners.delete(l);
}

/** How many toasts the policy dropped this page (the shot harness asserts this stays 0 on real flows). */
export const blockedToastCount = () => blocked;

export function _resetToastsForTests(): void {
  list = [];
  blocked = 0;
  nextId = 1;
  listeners.clear();
}
