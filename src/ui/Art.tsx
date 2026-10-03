// <Art>: one generated image by manifest id (docs/design/assets/MANIFEST.json), with a designed flat fallback
// (PRODUCT-DESIGN-V2 §12: "every screen has a flat fallback that ships before the art exists"; B1 needs no art).
// Which ids exist is read once per page: public/assets/gen/manifest.json (written by scripts/gen-assets.mjs, B2)
// when present, else public/assets/gen/INDEX.json (the Codex run's own ledger: items with status "done").
// Until either says an id is done, NO image request is made and the fallback renders; when the art lands the
// same component swaps to the image on the next page load, with no code change. A broken file falls back too.
// Tier D (and the child's "still picture" choice) never loads backgrounds (§7.4).
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

type Ready = Map<string, string>; // id → public URL
let ready: Ready | null = null;
let loading: Promise<Ready> | null = null;

const toUrl = (path: string) => (path.startsWith("public/") ? `/${path.slice("public/".length)}` : path.startsWith("/") ? path : `/${path}`);

async function readJson(url: string): Promise<unknown> {
  try {
    const r = await fetch(url, { credentials: "same-origin" });
    if (!r.ok || !(r.headers.get("content-type") ?? "").includes("json")) return null;
    return await r.json();
  } catch {
    return null;
  }
}

/** Load the set of finished art once. Never throws; an absent ledger means "no art yet". */
export function loadArt(): Promise<Ready> {
  if (ready) return Promise.resolve(ready);
  loading ??= (async () => {
    const out: Ready = new Map();
    const man = (await readJson("/assets/gen/manifest.json")) as { assets?: { id: string; url?: string; path?: string }[] } | null;
    if (man?.assets?.length) {
      for (const a of man.assets) if (a.url || a.path) out.set(a.id, toUrl(a.url ?? a.path!));
    } else {
      const ix = (await readJson("/assets/gen/INDEX.json")) as { items?: Record<string, { path?: string; status?: string }> } | null;
      for (const [id, it] of Object.entries(ix?.items ?? {})) if (it.status === "done" && it.path) out.set(id, toUrl(it.path));
    }
    ready = out;
    return out;
  })();
  return loading;
}

export function useArt(id: string, enabled = true): string | null {
  const [url, setUrl] = useState<string | null>(() => (enabled ? ready?.get(id) ?? null : null));
  useEffect(() => {
    if (!enabled) return setUrl(null);
    let live = true;
    void loadArt().then((m) => live && setUrl(m.get(id) ?? null));
    return () => {
      live = false;
    };
  }, [id, enabled]);
  return url;
}

/** Fallback tint per art family: a token colour, never a raw hex (PD-G13). */
const TINT: Record<string, string> = {
  states: "var(--art-stone)",
  picto: "var(--nib-soft)",
  bg: "var(--tray)",
  avatars: "var(--art-teal)",
  interests: "var(--art-sky)",
  promises: "var(--art-leaf)",
};

export function Art({ id, alt = "", className, style, fallback, enabled = true, cover }:
  { id: string; alt?: string; className?: string; style?: CSSProperties; fallback?: ReactNode; enabled?: boolean; cover?: boolean }) {
  const url = useArt(id, enabled);
  const [broken, setBroken] = useState(false);
  if (url && !broken) {
    return (
      <img src={url} alt={alt} className={className} style={{ objectFit: cover ? "cover" : "contain", ...style }} data-art={id}
        decoding="async" loading="lazy" onError={() => setBroken(true)} />
    );
  }
  // The designed placeholder: a token-coloured shape (or the caller's code-drawn fallback). Never text.
  return (
    <span className={`art-fallback ${className ?? ""}`} style={style} data-art={id} data-art-fallback="" role={alt ? "img" : undefined}
      aria-label={alt || undefined} aria-hidden={alt ? undefined : true}>
      {fallback ?? <span className="art-fallback-shape" style={{ background: TINT[id.split("/")[0]] ?? "var(--tray)" }} />}
    </span>
  );
}
