// round 3 fix (experience B2, "her words point at an empty screen"): the frame runs each engine's pure normalize() on the
// mount params and reports a config error, and the Desk then takes the module off the tray (T7) — while her line, written
// from the server's facts row, still says "point to the screen's shape" (c6-04: a geoboard planned for a 50 m by 30 m park
// has no shape on a 12-peg board). The server now runs the SAME normalize() (the *.logic.ts code the frame imports, under
// Node's type stripping, as recheck.js already does) and never mounts a config the frame would refuse. Pure, < 1 ms.
import * as GEO from "../../src/modules/frame/engines/geoboard.logic.ts";
import * as MS from "../../src/modules/frame/engines/measure.logic.ts";
import * as NL from "../../src/modules/frame/engines/numberLine.logic.ts";
import * as DG from "../../src/modules/frame/engines/dataGraphs.logic.ts";
import * as FR from "../../src/modules/frame/engines/fractions.logic.ts";
import * as MD from "../../src/modules/frame/engines/multiplyDivide.logic.ts";
import * as PT from "../../src/modules/frame/engines/patterns.logic.ts";
import * as ML from "../../src/modules/frame/engines/motionLab.logic.ts";
import * as SKY from "../../src/modules/frame/engines/sky.logic.ts";

const NORMALIZE = {
  "geoboard@1": (p) => GEO.normalize(p),
  "measure@1": (p) => MS.normalize(p),
  "number-line@1": (p) => NL.normalize(p),
  "data-graphs@1": (p) => DG.normalize(p),
  "fractions@1": (p) => FR.normalize(p),
  "multiply-divide@1": (p) => MD.normalize(p),
  "patterns@1": (p) => PT.normalize(p),
  "motion-lab@1": (p) => ML.normalize(p),
  "sky@1": (p) => SKY.normalize(p),
};

/** The config error the frame would report for these mount params, or null (no normalizer, or a clean config). */
export function engineConfigError(engine, params) {
  const f = NORMALIZE[engine];
  if (!f) return null;
  try {
    const c = f(params ?? {});
    return typeof c?.error === "string" && c.error ? c.error : null;
  } catch (e) {
    return `normalize threw: ${String(e?.message ?? e).slice(0, 80)}`;
  }
}
