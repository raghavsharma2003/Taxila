// Where to go after sign-in (?next=). PURE (tests/ui-v2-claims.test.mjs covers it).
// Same-origin paths only ("//host" would make pushState throw, and an absolute URL would be an open redirect), never
// back into the sign-in step itself (a loop), and no control characters or backslashes ("/\evil.com" is a host to
// some browsers).
export function safeNext(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const next = raw.trim();
  if (!/^\/(?![/\\])/.test(next) || /[\u0000-\u001f\\]/.test(next)) return null;
  if (/^\/start\/phone(\/|\?|$)/.test(next)) return null;
  return next;
}
