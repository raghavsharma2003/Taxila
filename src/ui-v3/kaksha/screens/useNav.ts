// r7 app-nav-unified: the dock and the Me door for the current child, read from ChildShell and the router. Surfaces come
// from the plan when the screen has it, else from the last plan this device saw (cachedSurfaces).
import { useLocation, useNavigate } from "react-router-dom";
import { useChild } from "../../../child/ChildShell.tsx";
import { cachedSurfaces } from "../../../child/plan.ts";
import { backOf, dockItems, navKeyOf, type NavItem, type NavKey } from "../nav.tsx";

export interface ChildNav { dock: NavItem[]; meTo: string; active: NavKey | null; backTo: string | null; go: (to: string) => void }

export function useChildNav(surfaces?: { map?: boolean; notebook?: boolean } | null): ChildNav {
  const { cid, family } = useChild();
  const nav = useNavigate();
  const { pathname } = useLocation();
  return {
    dock: dockItems({ cid, family, surfaces: surfaces ?? cachedSurfaces(cid) }),
    meTo: `/c/${cid}/me`,
    active: navKeyOf(pathname),
    backTo: backOf(pathname, cid),
    go: (to) => nav(to),
  };
}
