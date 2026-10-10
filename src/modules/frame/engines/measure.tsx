// measure@1 maths core — read or set a scale (maths M13).
//   ruler:       an object lies on a ruler, possibly not starting at 0 (`start`); the child gives its length.
//                Reading the end mark when start ≠ 0 is logged as end_read (the START_AT_EDGE confusion).
//   jug:         read the water level, or pour (−/+) to a target.
//   thermometer: read the temperature, or set it to a target.
// Readings are entered with a stepper in the scale's division (no free typing). Highlight: "object",
// "level", "mark:<value>", "reading", "check". Reveal: the reading is drawn on the scale.
import { useMemo, useState } from "react";
import type { EngineModule, EngineProps } from "../engine.ts";
import { defineEngine, GENERIC_MODES } from "../kit/def.ts";
import { say, tri } from "../kit/i18n.ts";
import { useTracker } from "../kit/tracker.ts";
import { CheckBtn, cls, EngineRoot, Prompt, Stepper, useEngineError, useHl, useIssues, Verdict } from "../kit/ui.tsx";
import { fmtNum, normalize, readCorrect, readMisc, type MSConfig } from "./measure.logic.ts";

const def = defineEngine({
  id: "measure@1",
  title: "Measuring scales",
  subjects: ["maths", "science", "evs"],
  params: {
    tool: { type: "string", enum: ["ruler", "jug", "thermometer"], doc: "default: from representation, else ruler" },
    mode: { type: "string", enum: ["read", "set", ...GENERIC_MODES], default: "read", doc: "read the scale, or set it to value" },
    value: { type: "number", min: -50, max: 5000, doc: "ruler: the object's length; jug: the level; thermometer: the temperature" },
    start: { type: "number", min: 0, max: 29, default: 0, doc: "ruler: where the object starts (≠ 0 = a broken-ruler reading)" },
    min: { type: "number", min: -50, max: 5000, doc: "scale start" },
    max: { type: "number", min: -40, max: 5000, doc: "scale end" },
    step: { type: "number", min: 0.1, max: 500, doc: "smallest division (ruler 0.5 cm, jug 50 mL, thermometer 1 °C)" },
    major: { type: "number", min: 0.1, max: 1000, doc: "labelled division" },
    unit: { type: "string", doc: "unit label (≤ 4 chars), default by tool" },
  },
  emits: ["ms.read", "ms.set"],
});

const TX = {
  ruler: tri("How long is it?", "Yeh kitna lamba hai?", "यह कितना लंबा है?"),
  jug: tri("How much water is in the jug?", "Jug mein kitna paani hai?", "जग में कितना पानी है?"),
  thermometer: tri("What temperature does it show?", "Kitna taapmaan dikh raha hai?", "कितना तापमान दिख रहा है?"),
  setJug: tri("Pour water up to", "Itna paani daalo:", "इतना पानी डालो:"),
  setThermo: tri("Set the thermometer to", "Thermometer ko itna karo:", "थर्मामीटर को इतना करो:"),
  setRuler: tri("Make the strip this long:", "Patti itni lambi karo:", "पट्टी इतनी लंबी करो:"),
  reading: tri("Reading", "Padhai", "पढ़ाई"),
  length: tri("Length", "Lambai", "लंबाई"),
};

function Scale({ c, level, revealed, hlOf }: { c: MSConfig; level: number; revealed: boolean; hlOf: ReturnType<typeof useHl> }) {
  const n = Math.round((c.max - c.min) / c.step);
  const marks = Array.from({ length: n + 1 }, (_, i) => c.min + i * c.step);
  const isMajor = (v: number) => Math.abs(v / c.major - Math.round(v / c.major)) < 1e-6;
  const obj = hlOf("object");
  const lv = hlOf("level");
  if (c.tool === "ruler") {
    const x = (v: number) => 14 + ((v - c.min) * 312) / (c.max - c.min);
    return (
      <svg className="ek-svg ms-svg" viewBox="0 0 340 120" role="img" aria-label={`ruler ${c.min} to ${c.max} ${c.unit}`}>
        <rect key={obj.key} className={cls("ms-object", obj.cls)} x={x(c.start)} y={18} width={x(c.start + level) - x(c.start)} height={22} rx={4} data-target="object" />
        <rect className="ms-body" x={6} y={52} width={328} height={60} rx={6} />
        {marks.map((v) => (
          <g key={v} data-mark={fmtNum(v)}>
            <line className={isMajor(v) ? "ms-major" : "ms-minor"} x1={x(v)} x2={x(v)} y1={52} y2={52 + (isMajor(v) ? 22 : 12)} />
            {isMajor(v) && <text x={x(v)} y={92} textAnchor="middle">{fmtNum(v)}</text>}
          </g>
        ))}
        {revealed && <line className="nl-ring" x1={x(c.start + c.value)} x2={x(c.start + c.value)} y1={10} y2={112} />}
      </svg>
    );
  }
  const y = (v: number) => 228 - ((v - c.min) * 200) / (c.max - c.min);
  const labelEvery = Math.max(1, Math.round(marks.filter(isMajor).length / 10));
  return (
    <svg className="ek-svg ms-svg" viewBox="0 0 220 250" style={{ maxWidth: 240, margin: "0 auto" }} role="img" aria-label={`${c.tool} ${c.min} to ${c.max} ${c.unit}`}>
      {c.tool === "jug" ? (
        <>
          <rect key={lv.key} className={cls("ms-liquid", lv.cls)} x={82} y={y(level)} width={106} height={Math.max(0, 228 - y(level))} data-target="level" />
          <path className="ms-body" d="M80 18 L80 230 L190 230 L190 18" fill="none" />
        </>
      ) : (
        <>
          <rect className="ms-body" x={124} y={18} width={20} height={214} rx={10} />
          <circle className="ms-mercury" cx={134} cy={236} r={13} />
          <rect key={lv.key} className={cls("ms-mercury", lv.cls)} x={129} y={y(level)} width={10} height={Math.max(0, 236 - y(level))} data-target="level" />
        </>
      )}
      {marks.map((v, i) => (
        <g key={v} data-mark={fmtNum(v)}>
          <line className={isMajor(v) ? "ms-major" : "ms-minor"} x1={isMajor(v) ? 52 : 62} x2={76} y1={y(v)} y2={y(v)} />
          {isMajor(v) && (Math.round((v - c.min) / c.major) % labelEvery === 0) && <text x={46} y={y(v) + 4} textAnchor="end">{fmtNum(v)}</text>}
          {/* the unit sits right of the scale's foot, clear of the 0 label (round 4: "0" × "mL" overlapped at every size) */}
          {i === 0 && <text x={78} y={248} textAnchor="start" data-keep="">{c.unit}</text>}
        </g>
      ))}
      {revealed && <line className="nl-ring" x1={50} x2={196} y1={y(c.value)} y2={y(c.value)} />}
    </svg>
  );
}

function Measure({ params, goal, lang, ageBand, highlight, revealed, api }: EngineProps) {
  const c = useMemo(() => normalize(params), [params]);
  useIssues(c.issues, api);
  useEngineError(c.error, api);
  const hl = useHl(highlight);
  const key = `${c.tool}|${c.mode}|${c.min}|${c.max}|${c.step}|${c.value}|${c.start}`;
  const t = useTracker(api, key, { stuckAfterChanges: 60 });
  const lo = c.tool === "ruler" ? 0 : c.min;
  const hi = c.tool === "ruler" ? c.max - c.start : c.max;
  const [s, setS] = useState({ key, v: lo, verdict: null as boolean | null });
  if (s.key !== key) setS({ key, v: lo, verdict: null });
  const level = c.mode === "set" ? s.v : c.value;

  const change = (v: number) => {
    if (t.done) return;
    setS({ ...s, v, verdict: null });
    t.change(c.mode === "set" ? "ms.set" : "ms.read", { value: v, unit: c.unit });
  };
  const check = () => {
    const ok = readCorrect(c, s.v);
    const misc = c.mode === "read" ? readMisc(c, s.v) : null;
    setS({ ...s, verdict: ok });
    t.answer({ kind: c.mode === "set" ? "ms.set" : "ms.read", tool: c.tool, value: s.v, unit: c.unit, ...(c.tool === "ruler" && { start: c.start }), ...(misc && { misc }) }, ok, goal || `${c.mode} ${c.value}${c.unit}`);
  };
  const ask = c.mode === "set"
    ? <>{say(c.tool === "jug" ? TX.setJug : c.tool === "thermometer" ? TX.setThermo : TX.setRuler, lang)} <strong className="ek-math">{fmtNum(c.value)} {c.unit}</strong></>
    : say(TX[c.tool], lang);
  return (
    <EngineRoot name="measure" ageBand={ageBand} mode={c.mode}>
      <Prompt>{ask}</Prompt>
      <Scale c={c} level={level} revealed={revealed} hlOf={hl} />
      <Stepper label={`${say(c.tool === "ruler" ? TX.length : TX.reading, lang)} (${c.unit})`} value={s.v} min={lo} max={hi} step={c.step} big={c.major > c.step ? c.major : undefined} onChange={change} fmt={fmtNum} target="reading" hl={hl("reading").cls} lang={lang} />
      <div className="ek-row"><CheckBtn lang={lang} onClick={check} disabled={!!c.error} hl={hl("check").cls} /></div>
      <Verdict ok={s.verdict} lang={lang} />
    </EngineRoot>
  );
}

export const engine: EngineModule = { def, Component: Measure };
