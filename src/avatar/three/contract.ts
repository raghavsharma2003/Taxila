// The look contract (teacher-anim §5.1): what a face must ship for the lesson runtime to load it, and the pure
// rules that turn a look's runtime.json into renderer settings. No three.js here, so node tests and the publish
// script (scripts/character/publish-look.mjs) use the same code as the browser.
//
// A face = tier GLBs (meshes face / eyes / cards / hair / garment [/ lens], ARKit-52 morph names, the bones below)
// + runtime.json (schema 1) + a D plate rendered from its own B+ (plate.webp, a 5-cell mouth strip, a blink overlay).
// Swapping a face is an asset change plus a lookRev bump; nothing in src/ changes.
//
// runtime.json fields the runtime reads (all others are documentation):
//   schema 1 · look · lookRev · tiers.{Bplus,Blite}.file · lighting (key, rim, SH[, bounceColor]) · jawCeiling ·
//   iris · faceStyle.{restSmile} · visemeFold.map · correctives · eyePass.{sclera,restLid} ·
//   mouthInterior.{teeth,gum,tongue,bag} · shading.{profile,pupil,lidShadow,hairKK,cardRim,hairLumaGate} · plates
// A look's art fixes were made against ONE face, so each is declared data here, never a code fork per look.

export type RigTier = "H" | "Bplus" | "Blite";
export type Vec3 = [number, number, number];

export interface RuntimeShading {
  /** "v2" = iteration-2 shading exactly as G9 solved it (default); "merged" = the merged bake-off's shading. */
  profile?: "v2" | "merged";
  pupil?: number;
  lidShadow?: number;
  /** Kajiya-Kay highlight strength on the hair shell (cards always 0). */
  hairKK?: number;
  /** false: no rim on hair cards. */
  cardRim?: boolean;
  /** true: scalp hair painted into the skin atlas takes no rim / sheen. */
  hairLumaGate?: boolean;
}

export interface PlateMeta {
  plate: [number, number];
  mouthRect: [number, number, number, number];
  mouthCells: number;
  mouthJaw: number[];
  blinkRect: [number, number, number, number];
  bytes?: number;
  /** Published (hashed) file names, relative to the look's base URL. */
  files?: { plate: string; mouth: string; blink: string };
}

export interface RuntimeJson {
  schema: number;
  look: string;
  lookRev: number;
  tiers: Partial<Record<RigTier, { file: string; bytes?: number; triangles?: number; draws?: number; morphTargets?: number }>>;
  lighting?: { toneMapping?: string; exposure?: number; keyDir: number[]; keyColor: number[]; rimDir: number[]; rimColor: number[]; sh: number[][]; bounceColor?: number[] };
  jawCeiling?: number;
  iris?: string;
  faceStyle?: { restSmile?: number; asym?: { smile?: number; brow?: number; squint?: number } };
  visemeFold?: { map?: Record<string, Record<string, number>> };
  correctives?: Record<string, [string, string]>;
  eyePass?: { sclera?: number[]; restLid?: number };
  mouthInterior?: { teeth?: number[]; gum?: number[]; tongue?: number[]; bag?: number[] };
  shading?: RuntimeShading;
  emotions?: Record<string, unknown>;
  states?: Record<string, unknown>;
  plates?: PlateMeta | null;
}

/** One entry of src/avatar/looks.gen.json (written by publish-look.mjs). */
export interface LookEntry {
  rev: number;
  /** "/assets/teacher/<look>/<rev>/" */
  base: string;
  /** Hashed runtime.json name under base. */
  runtime: string;
  /** The plate renders' scene background: the 3D canvas clears to it, so B → D is the same picture. */
  backdrop: string;
  tiers: Partial<Record<RigTier, { file: string; bytes: number }>>;
  plate: PlateMeta | null;
  iris?: string | null;
  jawCeiling?: number | null;
}

export const REQUIRED_MESHES = ["face", "eyes", "hair", "garment"] as const;
export const REQUIRED_BONES = ["Neck", "Head", "LeftEye", "RightEye"] as const;
/** The runtime decodes exactly these; a GLB requiring anything else cannot load. */
export const SUPPORTED_EXTENSIONS = new Set([
  "EXT_meshopt_compression", "KHR_mesh_quantization", "KHR_texture_basisu", "KHR_materials_clearcoat", "KHR_materials_sheen",
  "KHR_materials_specular", "KHR_texture_transform", "KHR_materials_emissive_strength",
]);
/** B+ budget (BUILD-PLAN W1-F item 2): ≤ 2.2 MB. B-lite ≈ 0.75 MB; 1.2 MB is the hard ceiling. */
export const TIER_BUDGET_BYTES: Record<RigTier, number> = { H: 6_500_000, Bplus: 2_200_000, Blite: 1_200_000 };

/** Every way a runtime.json breaks the contract (empty = loadable). */
export function validateRuntime(rt: unknown, opts: { tiers?: string[] } = {}): string[] {
  const p: string[] = [];
  const r = rt as Partial<RuntimeJson> | null;
  if (!r || typeof r !== "object") return ["runtime.json is not an object"];
  if (r.schema !== 1) p.push(`schema ${String(r.schema)} (the runtime reads schema 1)`);
  if (typeof r.look !== "string" || !r.look) p.push("look missing");
  if (!Number.isInteger(r.lookRev) || (r.lookRev as number) < 1) p.push("lookRev must be an integer >= 1");
  for (const t of opts.tiers ?? ["Bplus", "Blite"]) {
    const tm = r.tiers?.[t as RigTier];
    if (!tm || typeof tm.file !== "string") p.push(`tiers.${t}.file missing`);
    else if (typeof tm.bytes === "number" && tm.bytes > TIER_BUDGET_BYTES[t as RigTier]) p.push(`tiers.${t} ${tm.bytes} B over the ${TIER_BUDGET_BYTES[t as RigTier]} B budget`);
  }
  const L = r.lighting;
  if (!L) p.push("lighting missing (the skin albedo is solved against the look's own rig, G9)");
  else {
    for (const k of ["keyDir", "keyColor", "rimDir", "rimColor"] as const) if (!Array.isArray(L[k]) || L[k].length !== 3) p.push(`lighting.${k} must be a vec3`);
    if (!Array.isArray(L.sh) || L.sh.length !== 4) p.push("lighting.sh must hold 4 vec3");
    if (L.toneMapping && L.toneMapping !== "Neutral") p.push(`lighting.toneMapping ${L.toneMapping} (the runtime renders Neutral)`);
  }
  if (r.jawCeiling !== undefined && !(r.jawCeiling > 0 && r.jawCeiling <= 1)) p.push("jawCeiling must be in (0, 1]");
  const pl = r.plates;
  if (pl) {
    if (!Array.isArray(pl.plate) || !Array.isArray(pl.mouthRect) || !Array.isArray(pl.blinkRect)) p.push("plates: plate / mouthRect / blinkRect missing");
    if (pl.mouthCells !== 5) p.push("plates.mouthCells must be 5 (the mouthCell() strip)");
  }
  const sh = r.shading;
  if (sh?.profile && sh.profile !== "v2" && sh.profile !== "merged") p.push(`shading.profile ${sh.profile}`);
  return p;
}

/** Problems with a GLB's own JSON chunk against the contract (meshes, bones, extensions). */
export function validateGltfJson(j: { extensionsRequired?: string[]; meshes?: { name?: string }[]; nodes?: { name?: string }[] }): string[] {
  const p: string[] = [];
  for (const e of j.extensionsRequired ?? []) if (!SUPPORTED_EXTENSIONS.has(e)) p.push(`requires unsupported extension ${e}`);
  const meshes = new Set((j.meshes ?? []).map((m) => m.name));
  for (const m of REQUIRED_MESHES) if (!meshes.has(m)) p.push(`mesh "${m}" missing`);
  const nodes = new Set((j.nodes ?? []).map((n) => n.name));
  for (const b of REQUIRED_BONES) if (!nodes.has(b)) p.push(`bone "${b}" missing`);
  return p;
}

export interface ResolvedShading {
  merged: boolean;
  pupil: number;
  lidShadow: number;
  hairKK: number;
  cardRim: boolean;
  hairLumaGate: boolean;
  teeth: Vec3; gum: Vec3; tongue: Vec3; bag: Vec3;
  sclera: Vec3;
  restLid: number;
}

const v = (a: number[] | undefined, d: Vec3): Vec3 => (Array.isArray(a) && a.length === 3 ? [a[0], a[1], a[2]] : d);

/**
 * The renderer settings a look declares, with the iteration-2 values as the defaults (public/assets/teacher's first
 * set was gated under them, G9). "merged" is declared by shading.profile or implied by an eyePass / mouthInterior
 * block (the merged bake-off writes both); its defaults are the merged viewer's.
 */
export function resolveShading(rt: Pick<RuntimeJson, "shading" | "eyePass" | "mouthInterior">): ResolvedShading {
  const s = rt.shading ?? {};
  const merged = s.profile ? s.profile === "merged" : !!(rt.eyePass || rt.mouthInterior);
  const mi = rt.mouthInterior ?? {};
  return {
    merged,
    pupil: s.pupil ?? (merged ? 0.33 : 0.42),
    lidShadow: s.lidShadow ?? (merged ? 0.65 : 0.8),
    hairKK: s.hairKK ?? 0.32,
    cardRim: s.cardRim ?? true,
    hairLumaGate: !!s.hairLumaGate,
    teeth: v(mi.teeth, merged ? [0.86, 0.78, 0.64] : [0.6, 0.55, 0.46]),
    gum: v(mi.gum, [0.3, 0.1, 0.09]),
    tongue: v(mi.tongue, merged ? [0.46, 0.16, 0.14] : [0.4, 0.13, 0.11]),
    bag: v(mi.bag, merged ? [0.16, 0.045, 0.04] : [0.09, 0.022, 0.018]),
    sclera: v(rt.eyePass?.sclera, [0.78, 0.74, 0.7]),
    restLid: rt.eyePass?.restLid ?? 0.35,
  };
}

/** GLB tier for a face tier: B is B+ (teacher-anim §5.3 step 4); D / E load no GLB. */
export function rigTierFor(faceTier: string): RigTier | null {
  return faceTier === "B" ? "Bplus" : faceTier === "Blite" ? "Blite" : null;
}

/** Absolute URL of a published file of a look (base is "/assets/teacher/<look>/<rev>/"). */
export const lookUrl = (e: Pick<LookEntry, "base">, file: string) => `${e.base}${file}`;

/** The plate's cover-fit box for a host of w x h (like object-fit: cover, focus at fy of the height). */
export function coverBox(w: number, h: number, pw: number, ph: number, fy = 0.4): { width: number; height: number; left: number; top: number; scale: number } {
  const scale = Math.max(w / pw, h / ph);
  const width = pw * scale, height = ph * scale;
  return { width, height, left: (w - width) / 2, top: (h - height) * fy, scale };
}
