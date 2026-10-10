// The child root for /c/:cid/*: loads the child from /api/me (the server scopes it to the signed-in guardian),
// resolves the visual band, and provides it all through context (PRODUCT-DESIGN-V2 §13.1 ChildShell).
// It writes data-band on <html> and on its own [data-v2] root, and data-theme: ALWAYS "light" for Young (b1/b2 are
// light-only, `ds-band-fork-older`), the child's Light / Dark / Match phone choice for Older. No child-facing error
// copy beyond the designed T8 line: a missing session asks for a grown-up.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, Outlet, useParams } from "react-router-dom";
import { ApiError, getMe, type ChildRow, type MeResponse } from "./api.ts";
import { bandForClass, effectiveBand, familyOf, type Band, type Family } from "./band.ts";
import { t, type Lang } from "./copy.ts";
import { usePrefs, type ChildPrefs } from "./prefs.ts";
import { TeacherNameProvider } from "../ui/teacher/useTeacher.ts";
// round 3 fix (experience B9): the hands-free switch is asked once the child is signed in, long before a lesson starts
import { prefetchDuplexConfig } from "../duplex/flags.ts";
import "./child.css";

export interface ChildCtx {
  cid: string;
  child: ChildRow;
  me: MeResponse;
  band: Band;
  family: Family;
  /** The language SHE speaks (the family's choice). Chrome is English whatever this is. */
  lang: Lang;
  prefs: ChildPrefs;
  setPrefs: (p: Partial<ChildPrefs>) => void;
  reducedMotion: boolean;
  /** Re-read /api/me (after Hello saves the avatar, or a teacher switch). */
  refresh: () => void;
}

const Ctx = createContext<ChildCtx | null>(null);

export function useChild(): ChildCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useChild outside <ChildShell>");
  return c;
}

function useReducedMotionQuery(): boolean {
  const [rm, setRm] = useState(() => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    if (typeof matchMedia !== "function") return;
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setRm(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return rm;
}

/** The theme a band may use: Young is light-only; Older follows the child's choice ("system" = no attribute). */
export const themeFor = (band: Band, pref: ChildPrefs["theme"]): "light" | "dark" | undefined =>
  familyOf(band) === "young" ? "light" : pref === "system" ? undefined : pref;

/** Mirror the band and theme on <html> (the token file keys :root on them), restoring the previous values on exit. */
function useHtmlAttrs(band: Band | null, theme: "light" | "dark" | undefined, reduced: boolean) {
  useEffect(() => {
    const el = document.documentElement;
    const prev = { band: el.getAttribute("data-band"), theme: el.getAttribute("data-theme"), motion: el.getAttribute("data-motion") };
    const set = (k: string, v: string | null | undefined) => (v ? el.setAttribute(k, v) : el.removeAttribute(k));
    set("data-band", band);
    set("data-theme", theme);
    set("data-motion", reduced ? "reduce" : prev.motion);
    return () => {
      set("data-band", prev.band);
      set("data-theme", prev.theme);
      set("data-motion", prev.motion);
    };
  }, [band, theme, reduced]);
}

export function ChildShell({ children }: { children?: ReactNode }) {
  const { cid = "" } = useParams();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "signedout" | "missing" | "error">("loading");
  const [n, setN] = useState(0);
  const [prefs, setPrefs] = usePrefs(cid);
  const osReduced = useReducedMotionQuery();

  useEffect(() => {
    let live = true;
    getMe()
      .then((m) => {
        if (!live) return;
        prefetchDuplexConfig();
        setMe(m);
        setState(m.children.some((c) => c.id === cid) ? "ok" : "missing");
      })
      .catch((e) => live && setState(e instanceof ApiError && e.status === 401 ? "signedout" : "error"));
    return () => {
      live = false;
    };
  }, [cid, n]);

  const child = me?.children.find((c) => c.id === cid) ?? null;
  const ctx = useMemo<ChildCtx | null>(() => {
    if (!me || !child) return null;
    const band = effectiveBand(bandForClass(Number(child.class_level) || 1), prefs.bandUp);
    const lang = (["hinglish", "hindi", "english"].includes(child.language_pref) ? child.language_pref : "hinglish") as Lang;
    return { cid, child, me, band, family: familyOf(band), lang, prefs, setPrefs, reducedMotion: osReduced || prefs.calm, refresh: () => setN((x) => x + 1) };
  }, [me, child, cid, prefs, setPrefs, osReduced]);

  const band = ctx?.band ?? null;
  const theme = band ? themeFor(band, prefs.theme) : "light";
  useHtmlAttrs(band, theme, !!ctx?.reducedMotion);
  const rootAttrs = {
    className: "tx-child",
    "data-v2": "",
    "data-band": band ?? "b3",
    "data-family": ctx?.family ?? "older",
    "data-theme": theme,
    "data-comfort": prefs.largeText ? "large" : undefined,
    lang: "en",
  };

  if (!ctx) {
    return (
      <div {...rootAttrs}>
        <main className="cs-gate" aria-busy={state === "loading"} data-testid="child-gate">
          {state !== "loading" && (
            <div className="cs-card cs-gate-card">
              <h1 tabIndex={-1}>{state === "error" ? t("connectionWeak") : t("grownupSignIn")}</h1>
              {state === "error" ? (
                <button type="button" className="cs-btn cs-btn--primary" onClick={() => setN((x) => x + 1)}>{t("tryAgain")}</button>
              ) : (
                <Link className="cs-btn cs-btn--primary" to={state === "signedout" ? `/start/phone?login=1&next=${encodeURIComponent(location.pathname)}` : "/who"}>
                  {state === "signedout" ? t("signIn") : t("home")}
                </Link>
              )}
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <Ctx.Provider value={ctx}>
      {/* the name the child gave their teacher reaches every child surface (child-names-teacher) */}
      <TeacherNameProvider id={ctx.child.teacher_id} name={ctx.child.teacher_name}>
        <div {...rootAttrs}>{children ?? <Outlet />}</div>
      </TeacherNameProvider>
    </Ctx.Provider>
  );
}
