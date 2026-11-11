// The one Kaksha navigation model, pure (r7 app-nav-unified; nav.tsx draws it; tests/r7-app-nav.test.mjs pins it).
import { kt } from "./copy.ts";
import { practiceOffered, type HomePlan } from "../../child/plan.ts";

export type NavKey = "home" | "world" | "practice" | "ask" | "notebook" | "me";

export interface NavInput {
  cid: string;
  family: "young" | "older";
  /** plan.surfaces: false hides that entry (P6). Undefined: everything shows. */
  surfaces?: { map?: boolean; notebook?: boolean } | null;
}

export interface NavItem { key: Exclude<NavKey, "me">; to: string; label: string }

/** PURE (tests/r7-app-nav.test.mjs): the dock's entries for this child, in order. */
export function dockItems({ cid, family, surfaces }: NavInput): NavItem[] {
  const base = `/c/${cid}`;
  const all: Array<NavItem & { show: boolean }> = [
    { key: "home", to: base, label: kt("navHome"), show: true },
    { key: "world", to: `${base}/map`, label: kt("navWorld"), show: surfaces?.map !== false },
    { key: "practice", to: `${base}/practice`, label: kt("navPractice"), show: true },
    { key: "ask", to: `${base}/ask`, label: kt("navAsk"), show: family === "older" },
    { key: "notebook", to: `${base}/notebook`, label: kt("navNotebook"), show: surfaces?.notebook !== false },
  ];
  return all.filter((i) => i.show).map(({ show: _s, ...i }) => i);
}

/** PURE: which dock entry a child path belongs to (the Hangar sits under the World; Teacher and Me under Me). */
export function navKeyOf(pathname: string): NavKey | null {
  const m = pathname.match(/^\/c\/[^/]+\/?([^/?#]*)/);
  if (!m) return null;
  const seg = m[1];
  if (!seg) return "home";
  if (seg === "map" || seg === "hangar") return "world";
  if (seg === "practice") return "practice";
  if (seg === "ask" || seg === "doubt") return "ask";
  if (seg === "notebook" || seg === "notes") return "notebook";
  if (seg === "me" || seg === "teacher") return "me";
  return null;
}

/** PURE: where back goes from a child path (one level up; Home has no back). */
export function backOf(pathname: string, cid: string): string | null {
  const key = navKeyOf(pathname);
  if (key === null || key === "home") return null;
  if (/\/hangar\/?$/.test(pathname)) return `/c/${cid}/map`;
  if (/\/teacher\/?$/.test(pathname)) return `/c/${cid}/me`;
  return `/c/${cid}`;
}


/** APP-31: the dock as the plan allows it, the same rules the classic Home's tiles use: no Practice when the plan refuses it
 *  (offline without a pack, capped, resting, held), no Ask offline or held (it needs the network and a lesson). */
export function dockForPlan(dock: NavItem[], plan: Pick<HomePlan, "source" | "state" | "packReady">): NavItem[] {
  const ask = plan.state !== "offline" && plan.state !== "safety_hold";
  const practice = practiceOffered(plan);
  return dock.filter((d) => (d.key === "ask" ? ask : d.key === "practice" ? practice : true));
}
