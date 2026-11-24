// round 7 (C1 studio-board-richness, maps decision dc-r7-maps-no-outline): places pinned at their TRUE latitude/longitude
// on a labelled degree grid with a compass, and nothing else: no outline, coastline or state shape that could be read as a
// boundary. The gazetteer (data/geo/india-places.json, built by scripts/build-india-places.mjs) carries each place's
// coordinates and the source record they came from; a board can pin only a place it lists. Pure; never throws.
import { readFileSync } from "node:fs";

let GAZ = null;
function gazetteer() {
  if (GAZ) return GAZ;
  try { GAZ = JSON.parse(readFileSync(new URL("../../../data/geo/india-places.json", import.meta.url), "utf8")).places ?? []; }
  catch { GAZ = []; }
  return GAZ;
}

/** The gazetteer row a name (any of its names, any case) refers to, or null. */
export function placeNamed(name) {
  const n = String(name ?? "").trim().toLowerCase();
  if (!n) return null;
  return gazetteer().find((p) => p.names.some((x) => x.toLowerCase() === n)) ?? null;
}

const kitText = (kit) => { try { return JSON.stringify([kit?.expectations, kit?.workedExample, kit?.items]); } catch { return ""; } };
const esc = (w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * The places@1 call for a kit that names at least 3 gazetteer places (or `text`, read first): up to 6, in the order the
 * kit first names them, each labelled with the kit's own name for it ("Bombay" stays Bombay). The Tropic of Cancer is
 * drawn when the kit names it, the 82.5°E meridian when the kit says 82.5. → a call, or null.
 */
export function placesCall(kit, { text = "" } = {}) {
  try {
    // a maths word problem that names cities ("Delhi to Shimla is 350 km") is about its numbers, not where the cities are
    if (/-maths-/.test(String(kit?.topicId ?? ""))) return null;
    const t = `${String(text ?? "")} ${kitText(kit)}`;
    const seen = new Map();   // id → { at, name }
    for (const p of gazetteer()) {
      for (const name of p.names) {
        const m = t.match(new RegExp(`\\b${esc(name)}\\b`, "i"));
        if (m && (!seen.has(p.id) || m.index < seen.get(p.id).at)) seen.set(p.id, { at: m.index, name });
      }
    }
    if (seen.size < 3) return null;
    const places = [...seen.values()].sort((a, b) => a.at - b.at).slice(0, 6).map((s) => s.name);
    return { template: "places@1", places, ...(/\btropic of cancer\b/i.test(t) ? { tropic: true } : {}), ...(/\b82\.5\s*°?\s*E?\b/.test(t) ? { meridian: true } : {}) };
  } catch { return null; }
}
