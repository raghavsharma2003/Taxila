// The child root for /c/:cid/*: loads the child from /api/me (the server scopes it to the signed-in
// guardian), resolves the visual band, writes data-band / data-motion / data-theme on the child root, and
// provides it all through context. No child-facing error copy: a missing session asks for a grown-up.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, Outlet, useParams } from "react-router-dom";
import { ApiError, getMe, type ChildRow, type MeResponse } from "./api.ts";
import { bandForClass, effectiveBand, familyOf, type Band, type Family } from "./band.ts";
import { langAttr, t, type Lang } from "./copy.ts";
import { usePrefs, type ChildPrefs } from "./prefs.ts";
import "./tokens.css";
import "./child.css";

export interface ChildCtx {
  cid: string;
  child: ChildRow;
  me: MeResponse;
  band: Band;
  family: Family;
  lang: Lang;
  prefs: ChildPrefs;
  setPrefs: (p: Partial<ChildPrefs>) => void;
  reducedMotion: boolean;
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

export function ChildShell({ children }: { children?: ReactNode }) {
  const { cid = "" } = useParams();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "signedout" | "missing" | "error">("loading");
  const [prefs, setPrefs] = usePrefs(cid);
  const osReduced = useReducedMotionQuery();

  useEffect(() => {
    let live = true;
    getMe()
      .then((m) => {
        if (!live) return;
        setMe(m);
        setState(m.children.some((c) => c.id === cid) ? "ok" : "missing");
      })
      .catch((e) => live && setState(e instanceof ApiError && e.status === 401 ? "signedout" : "error"));
    return () => {
      live = false;
    };
  }, [cid]);

  const child = me?.children.find((c) => c.id === cid) ?? null;
  const ctx = useMemo<ChildCtx | null>(() => {
    if (!me || !child) return null;
    const band = effectiveBand(bandForClass(Number(child.class_level) || 1), prefs.bandUp);
    const lang = (["hinglish", "hindi", "english"].includes(child.language_pref) ? child.language_pref : "hinglish") as Lang;
    return { cid, child, me, band, family: familyOf(band), lang, prefs, setPrefs, reducedMotion: osReduced || prefs.calm };
  }, [me, child, cid, prefs, setPrefs, osReduced]);

  const lang = (child?.language_pref as Lang) ?? "hinglish";
  const rootAttrs = {
    className: "tx-child",
    "data-band": ctx?.band ?? "b2",
    "data-motion": ctx?.reducedMotion ? "reduced" : "full",
    "data-theme": prefs.theme === "system" ? undefined : prefs.theme,
    "data-comfort": prefs.largeText ? "large" : undefined,
    lang: langAttr(lang),
  };

  if (!ctx) {
    return (
      <div {...rootAttrs}>
        <main className="tx-screen tx-center" aria-busy={state === "loading"}>
          {state === "loading" ? (
            <p className="tx-muted" aria-label="loading">…</p>
          ) : (
            <div className="tx-card tx-stack">
              <h1>{t("grownupSignIn", lang)}</h1>
              {state === "error" && <p className="tx-muted">{t("connectionWeak", lang)}</p>}
              <Link className="tx-tile tx-tile--plain" to="/who">{t("home", lang)}</Link>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <Ctx.Provider value={ctx}>
      <div {...rootAttrs}>{children ?? <Outlet />}</div>
    </Ctx.Provider>
  );
}
