// The Kaksha look on ChildShell's root: the attributes that let childshell.css re-point the v2 tokens on every child
// screen Kaksha does not draw itself. Release 11 (dc-r4-volt-everywhere): for EVERY account, including the shell's own
// loading / error / signed-out gate before /api/me has answered (no family known yet → the older family's night look).
// Nothing only on a device that chose ?ui=classic (flag.ts), so that escape hatch still shows today's classic app.
import { kakshaEnabled } from "./flag.ts";
import { lookAttr, type Family } from "./look.ts";
import { kakshaThemeFor } from "./tokens.ts";

export function kakshaShellAttrs(me: object | null | undefined, family: Family | null | undefined): Record<string, string> {
  if (!kakshaEnabled((me as { ui?: { kaksha?: boolean } } | null | undefined)?.ui?.kaksha)) return {};
  const fam: Family = family ?? "older";
  const look = lookAttr(fam);
  return look ? { "data-klook": look, "data-ktheme": kakshaThemeFor(fam) } : {};
}
