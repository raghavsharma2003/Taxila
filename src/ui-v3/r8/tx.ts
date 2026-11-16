// The round 8 switch (docs/design/round8/PHASE2-BRIEF.md): which round 8 theme a device renders, or none.
//   ?tx=a        direction A "Paper and ink" on this device
//   ?tx=b        direction B "Night class" on this device
//   ?tx=off      the current look on this device, whatever the shipped default
//   ?tx=default  forget this device's choice (back to TX_DEFAULT)
// The choice is kept per device (localStorage). The shipped default is TX_DEFAULT. While it is null, production renders
// today's look for everyone except a device that opted in. When the owner approves, it is one line here.
// Presentation only: never a safety or data switch. The AI disclosure, the helplines and every server truth are the
// same on both paths.
export type TxTheme = "a" | "b";

/** The shipped default: null = the current look unless a device opts in. */
export const TX_DEFAULT: TxTheme | null = null;
export const TX_KEY = "tx.flag.ui.tx.r8";

export interface TxInputs {
  /** ?tx= on this page's URL (null when absent). */
  url: string | null;
  /** The device's stored choice: "a" | "b" | "off" | null. */
  stored: string | null;
  /** The shipped default. */
  def: TxTheme | null;
}

/** PURE: the stored value after this page's URL is applied, and the theme to render (tests/r8-tx-switch.test.mjs). */
export function txDecision(i: TxInputs): { store: string | null; theme: TxTheme | null } {
  let store = i.stored === "a" || i.stored === "b" || i.stored === "off" ? i.stored : null;
  if (i.url === "a" || i.url === "b" || i.url === "off") store = i.url;
  else if (i.url === "default") store = null;
  const theme = store === "off" ? null : store === "a" || store === "b" ? store : i.def;
  return { store, theme };
}

let cached: TxTheme | null | undefined;
/** The theme for this page (the URL is applied once per page). */
export function txTheme(): TxTheme | null {
  if (cached !== undefined) return cached;
  let url: string | null = null;
  let stored: string | null = null;
  try {
    if (typeof location !== "undefined") url = new URLSearchParams(location.search).get("tx");
  } catch {
    /* no URL */
  }
  try {
    if (typeof localStorage !== "undefined") stored = localStorage.getItem(TX_KEY);
  } catch {
    /* storage blocked */
  }
  const d = txDecision({ url, stored, def: TX_DEFAULT });
  try {
    if (typeof localStorage !== "undefined" && d.store !== stored) {
      if (d.store === null) localStorage.removeItem(TX_KEY);
      else localStorage.setItem(TX_KEY, d.store);
    }
  } catch {
    /* storage blocked: this page still follows the URL */
  }
  cached = d.theme;
  return cached;
}

/** Tests only. */
export function _resetTxForTests(): void {
  cached = undefined;
}

/** The root attributes for a screen under the switch. surface "light" is for the parent's screens (light in both themes). */
export function txAttrs(surface?: "light"): Record<string, string> {
  const t = txTheme();
  if (!t) return {};
  return surface ? { "data-tx": t, "data-tx-surface": surface } : { "data-tx": t };
}
