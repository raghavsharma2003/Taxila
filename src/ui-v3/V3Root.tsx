// The v3 root: theme (Night default for the child, Day for the parent corner and as a child opt-in), reduced motion
// (OS setting OR the in-app switch), the toast region, and the dev-time one-volt-per-screen assertion.
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import "./tokens.css";
import "./v3.css";
import { prefersReducedMotion } from "./motion.ts";
import { ToastRegion } from "./Toast.tsx";
import type { ThemeName } from "./tokens.ts";

interface V3Ctx {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  reducedMotion: boolean;
  setReducedMotion: (on: boolean | null) => void;
}
const Ctx = createContext<V3Ctx>({ theme: "night", setTheme: () => {}, reducedMotion: false, setReducedMotion: () => {} });
export const useV3 = () => useContext(Ctx);

/** Visible elements marked data-volt inside a root (the shot harness asserts ≤ 1 per screen state). */
export function countVolt(root: ParentNode): number {
  return [...root.querySelectorAll<HTMLElement>("[data-volt]")].filter((el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && Number(cs.opacity) > 0.05;
  }).length;
}

export function V3Root({ theme: initial = "night", children, className }: { theme?: ThemeName; children: ReactNode; className?: string }) {
  const [theme, setTheme] = useState<ThemeName>(initial);
  useEffect(() => setTheme(initial), [initial]);
  const [osReduced, setOsReduced] = useState(prefersReducedMotion);
  const [appReduced, setAppReduced] = useState<boolean | null>(null);
  useEffect(() => {
    if (typeof matchMedia === "undefined") return;
    const m = matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setOsReduced(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  const reducedMotion = appReduced ?? osReduced;
  const root = useRef<HTMLDivElement>(null);
  // Dev assertion: more than one volt element in a settled screen state is a design defect (DESIGN-V3 §3.1).
  useEffect(() => {
    if (!import.meta.env?.DEV || !root.current) return;
    const t = setTimeout(() => {
      if (root.current && countVolt(root.current) > 1) (window as unknown as { __v3VoltViolations?: number }).__v3VoltViolations = ((window as unknown as { __v3VoltViolations?: number }).__v3VoltViolations ?? 0) + 1;
    }, 800);
    return () => clearTimeout(t);
  });
  const ctx = useMemo(() => ({ theme, setTheme, reducedMotion, setReducedMotion: setAppReduced }), [theme, reducedMotion]);
  return (
    <Ctx.Provider value={ctx}>
      <div ref={root} className={`v3 v3-root${className ? ` ${className}` : ""}`} data-theme={theme} data-motion={reducedMotion ? "reduced" : undefined}>
        {children}
        <ToastRegion />
      </div>
    </Ctx.Provider>
  );
}
