// PURE (r7 app-auth-email-otp): a failed code request → one sentence, on the field it belongs to. Never the server's
// string: server/signin/code.js answers { field, code } (code.bad, code.tries, email.unavailable, phone.unavailable).
import { ApiError } from "../../lesson/api.ts";
import { tr7, type R7Key } from "../../copy/en.ts";

export const CODE_LEN = 6;
export type CodeField = "email" | "code";

const WORDS: Record<string, { field?: CodeField; key: R7Key }> = {
  "code.bad": { field: "code", key: "code.err.bad" },
  "code.tries": { field: "code", key: "code.err.tries" },
  "email.unavailable": { key: "code.err.unavailable" },
  "phone.unavailable": { key: "code.err.phone" },
};

/** PURE. Digits only, at most CODE_LEN (a pasted "123 456" or "Code: 123456" becomes 123456). */
export const cleanCode = (s: string) => s.replace(/\D/g, "").slice(0, CODE_LEN);

export function codeErrorOf(e: unknown, online = true): { field?: CodeField; text: string } {
  if (e instanceof ApiError) {
    const b = (e.body ?? {}) as { code?: string };
    const w = b.code ? WORDS[b.code] : undefined;
    if (w) return { field: w.field, text: tr7(w.key) };
    if (e.status === 429) return { text: tr7("code.err.wait") };
    if (e.status === 0 || !online) return { text: tr7("code.err.network") };
    return { text: tr7("code.err.generic") };
  }
  return { text: online ? tr7("code.err.generic") : tr7("code.err.network") };
}
