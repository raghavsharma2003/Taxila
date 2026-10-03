// The child screens' art loader (PRODUCT-DESIGN-V2 §7.4, §12, §12.2). Screens name art by MANIFEST id
// (docs/design/assets/MANIFEST.json), never by file path:
//   <Scene id="home-young" />   a painted ground: bg/<id>-phone below 720 px, bg/<id>-wide from 720 px (or a single
//                               bg/<id> with its 360-dp crop), 1x/2x srcset, LQIP while decoding;
//   <Spot id="states/garden-empty" size={160} />   a spot, sprite, avatar or pictogram, 1x/2x.
// Both read public/assets/gen/manifest.json (written by scripts/gen-assets.mjs) once per page, and fall back to the
// Codex run's INDEX.json in dev (masters, before the pipeline ran). Until an id is ready NO request is made and the
// designed fallback renders (a token-coloured, code-drawn shape, never text); when the art lands the same screen swaps
// to it on the next load with no code change. A broken file falls back too.
// Tier D (`?tier=D`, Save-Data, low device memory) and the child's "still picture"/"voice only" choice never load a
// background (§7.4 "tier D: backgrounds are replaced by flat --paper"); spots still load (≤ 40 KB each).
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

export interface ArtEntry {
  id: string;
  url: string;
  url2x?: string;
  width?: number;
  height?: number;
  bytes?: number;
  lqip?: string;
  phone?: { url: string; url2x?: string; width: number; height: number };
}

type Table = Map<string, ArtEntry>;
let table: Table | null = null;
let pending: Promise<Table> | null = null;
/** MANIFEST.topicMap (chapter id → topics/<motif>), carried in the client manifest by gen-assets. */
let topics: { default: string | null; map: Record<string, string> } = { default: "topics/open-book", map: {} };

const toUrl = (p: string) => (p.startsWith("public/") ? `/${p.slice(7)}` : p.startsWith("/") ? p : `/${p}`);

async function readJson(url: string): Promise<unknown> {
  try {
    const r = await fetch(url, { credentials: "same-origin" });
    if (!r.ok || !(r.headers.get("content-type") ?? "").includes("json")) return null;
    return await r.json();
  } catch {
    return null;
  }
}

/** The ready art, once per page. Never throws: no manifest means "no art yet". */
export function loadArtTable(): Promise<Table> {
  if (table) return Promise.resolve(table);
  pending ??= (async () => {
    const out: Table = new Map();
    const man = (await readJson("/assets/gen/manifest.json")) as { assets?: ArtEntry[]; topicMap?: typeof topics } | null;
    if (man?.topicMap?.map) topics = { default: man.topicMap.default ?? topics.default, map: man.topicMap.map };
    if (man?.assets?.length) {
      for (const a of man.assets) if (a?.id && a.url) out.set(a.id, a);
    } else if (import.meta.env.DEV) {
      // Dev only, before gen-assets ran: the masters themselves (never in a build: the vite plugin drops them).
      const ix = (await readJson("/assets/gen/INDEX.json")) as { items?: Record<string, { path?: string; status?: string; width?: number; height?: number }> } | null;
      for (const [id, it] of Object.entries(ix?.items ?? {})) if (it.status === "done" && it.path) out.set(id, { id, url: toUrl(it.path), width: it.width, height: it.height });
    }
    table = out;
    return out;
  })();
  return pending;
}

/** Test hook: forget the cached table (a new manifest in the same page). */
export function resetArtTable(): void {
  table = null;
  pending = null;
}

export function useArtEntry(id: string | null, enabled = true): ArtEntry | null {
  const [e, setE] = useState<ArtEntry | null>(() => (id && enabled ? table?.get(id) ?? null : null));
  useEffect(() => {
    if (!id || !enabled) return setE(null);
    let live = true;
    void loadArtTable().then((m) => live && setE(m.get(id) ?? null));
    return () => {
      live = false;
    };
  }, [id, enabled]);
  return e;
}

/** The Young topic picture for a topic or chapter id ("c3-maths-ch05-t02" → its chapter's motif). */
export function useTopicArt(topicOrChapterId: string | null | undefined): string {
  const [, force] = useState(0);
  useEffect(() => {
    let live = true;
    void loadArtTable().then(() => live && force((x) => x + 1));
    return () => {
      live = false;
    };
  }, []);
  const ch = (topicOrChapterId ?? "").replace(/-t\d+$/, "");
  return topics.map[ch] ?? topics.default ?? "topics/open-book";
}

/** Art tier: D means flat grounds (no backgrounds). Cheap signals only; the face's own tier probe is separate. */
export function artTierD(): boolean {
  if (typeof window === "undefined") return false;
  const q = new URLSearchParams(window.location.search);
  if (q.get("tier") === "D" || q.get("art") === "flat") return true;
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  if (nav.connection?.saveData) return true;
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 1) return true;
  try {
    if (matchMedia("(prefers-reduced-data: reduce)").matches) return true;
  } catch {
    /* unsupported query */
  }
  return false;
}

const srcset = (u: string, u2?: string) => (u2 ? `${u} 1x, ${u2} 2x` : u);

/**
 * A painted ground filling its (positioned) parent. `id` is the scene stem: "home-young" resolves bg/home-young-phone
 * and bg/home-young-wide; a single-file scene ("sky-panel") uses its phone crop below 720 px when it has one.
 */
export function Scene({ id, fallback, flat, className, position = "center" }:
  { id: string; fallback: ReactNode; flat?: boolean; className?: string; position?: string }) {
  const off = !!flat || artTierD();
  const phone = useArtEntry(`bg/${id}-phone`, !off);
  const wide = useArtEntry(`bg/${id}-wide`, !off);
  const single = useArtEntry(`bg/${id}`, !off);
  const [loaded, setLoaded] = useState(false);
  const [broken, setBroken] = useState(false);
  const narrow = phone ?? (single?.phone ? { ...single.phone, id: single.id, lqip: single.lqip } : null);
  const big = wide ?? single;
  const img = big ?? narrow;
  const style: CSSProperties = { objectPosition: position };
  return (
    <div className={`scene ${className ?? ""}`} aria-hidden="true" data-scene={id} data-scene-art={img && !broken ? "image" : "fallback"}>
      <div className="scene-fallback">{fallback}</div>
      {img && !broken && (
        <>
          {!loaded && (img.lqip ?? narrow?.lqip) && <img className="scene-lqip" src={img.lqip ?? narrow?.lqip} alt="" style={style} />}
          <picture>
            {big && narrow && <source media="(min-width: 720px)" srcSet={srcset(big.url, big.url2x)} />}
            <img className="scene-img" src={(narrow ?? img).url} srcSet={srcset((narrow ?? img).url, (narrow ?? img).url2x)} alt="" decoding="async"
              style={{ ...style, opacity: loaded ? 1 : 0 }} onLoad={() => setLoaded(true)} onError={() => setBroken(true)} />
          </picture>
        </>
      )}
    </div>
  );
}

/** A spot, sprite, avatar or pictogram by manifest id, `size` CSS px on its long side, with a designed fallback. */
export function Spot({ id, size, alt = "", fallback, className, style }:
  { id: string; size: number; alt?: string; fallback: ReactNode; className?: string; style?: CSSProperties }) {
  const e = useArtEntry(id);
  const [broken, setBroken] = useState(false);
  const box: CSSProperties = { width: size, height: size, ...style };
  if (e && !broken) {
    return (
      <img className={`spot ${className ?? ""}`} src={e.url} srcSet={srcset(e.url, e.url2x)} alt={alt} width={size} height={size} style={{ ...box, objectFit: "contain" }}
        data-art={id} decoding="async" onError={() => setBroken(true)} aria-hidden={alt ? undefined : true} />
    );
  }
  return (
    <span className={`spot spot-fallback ${className ?? ""}`} style={box} data-art={id} data-art-fallback="" role={alt ? "img" : undefined}
      aria-label={alt || undefined} aria-hidden={alt ? undefined : true}>
      {fallback}
    </span>
  );
}
