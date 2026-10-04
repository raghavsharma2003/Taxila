// PURE sign-in / sign-up error helpers (flows G12; W2-A #4), split from fields.tsx so tests run them without JSX.
import { ApiError } from "../lesson/api.ts";
import { tw2, type W2AKey } from "../copy/en.ts";

export type AuthField = "name" | "email" | "password";
export type FieldErrors = Partial<Record<AuthField, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** PURE. The checks a form runs before it sends anything (the same rules the server applies). */
export function checkAuthFields(f: { name?: string; email?: string; password?: string }, need: AuthField[], minPassword = 8): FieldErrors {
  const out: FieldErrors = {};
  if (need.includes("name") && !(f.name ?? "").trim()) out.name = tw2("auth.err.name.missing");
  if (need.includes("email")) {
    const e = (f.email ?? "").trim();
    if (!e) out.email = tw2("auth.err.email.missing");
    else if (!EMAIL.test(e)) out.email = tw2("auth.err.email.bad");
  }
  if (need.includes("password")) {
    if (!f.password) out.password = tw2("auth.err.password.missing");
    else if (minPassword && f.password.length < minPassword) out.password = tw2("auth.err.password.short");
  }
  return out;
}

const CODE_WORDS: Record<string, W2AKey> = {
  "name.missing": "auth.err.name.missing", "email.missing": "auth.err.email.missing", "email.bad": "auth.err.email.bad",
  "email.taken": "auth.err.email.taken", "password.missing": "auth.err.password.missing", "password.short": "auth.err.password.short",
};

/**
 * PURE. A failed auth request → a sentence on its field, or one sentence for the form. Never the server's message:
 * the server sends { field, code } for field errors (server/routes/account.js fieldError).
 */
export function authErrorOf(e: unknown, online = true): { field?: AuthField; text: string } {
  if (e instanceof ApiError) {
    const b = (e.body ?? {}) as { field?: AuthField; code?: string };
    if (b.code && CODE_WORDS[b.code]) return { field: b.field, text: tw2(CODE_WORDS[b.code]) };
    if (e.status === 429) return { text: tw2("auth.err.wait") };
    if (e.status === 400 && /email|password/i.test(e.message)) return { field: "password", text: tw2("auth.err.signin") };
    if (e.status === 0 || !online) return { text: tw2("auth.err.network") };
    return { text: tw2("auth.err.generic") };
  }
  return { text: online ? tw2("auth.err.generic") : tw2("auth.err.network") };
}

