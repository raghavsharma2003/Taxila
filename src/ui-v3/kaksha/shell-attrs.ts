// The Kaksha look on ChildShell's root (K-P14), pure: the attributes that let childshell.css re-point the v2 tokens on
// every child screen Kaksha does not draw itself. ONLY when ui.kaksha is on for this account (flag.ts, the server cohort)
// and the look is a futurist one; otherwise nothing (today's app, byte for byte: tests/prod/r4-kaksha-parity.mjs).
import { kakshaEnabled } from "./flag.ts";
import { lookAttr, type Family } from "./look.ts";
import { kakshaThemeFor } from "./tokens.ts";

export function kakshaShellAttrs(me: object | null | undefined, family: Family | null | undefined): Record<string, string> {
  if (!me || !family || !kakshaEnabled((me as { ui?: { kaksha?: boolean } }).ui?.kaksha)) return {};
  const look = lookAttr(family);
  return look ? { "data-klook": look, "data-ktheme": kakshaThemeFor(family) } : {};
}
