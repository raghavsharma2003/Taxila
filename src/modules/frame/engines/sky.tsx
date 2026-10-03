// sky@1 (2D) — Earth, Sun and Moon (science S08).
//   daynight: turn the Earth (hour −/+) and watch the marked place move between day and night; Check when it
//             shows the target (night, noon, sunrise …).
//   shadow:   move the Sun through the day (hour −/+); the stick's shadow (top view, N up) changes length and
//             direction; Check at the target (default: the shortest shadow).
//   phases:   move the Moon round the Earth (position −/+); the Moon as seen from India changes; Check at the
//             target phase (default: full).
// With predict (Director mode "predict"), a POE question comes first and the controls stay locked until the
// child commits a prediction; the prediction is graded by the same model. Highlight: "sun", "earth", "moon",
// "place", "stick", "shadow", "hour", "check". Reveal: the target state is drawn as a ghost / written out.
import { useMemo, useState } from "react";
import type { EngineModule, EngineProps } from "../engine.ts";
import { defineEngine, GENERIC_MODES } from "../kit/def.ts";
import { say, tri, type Tri } from "../kit/i18n.ts";
import { useTracker } from "../kit/tracker.ts";
import { CheckBtn, cls, EngineRoot, Poe, Prompt, Stepper, useHl, useIssues, Verdict } from "../kit/ui.tsx";
import { dayNightMeets, dayNightState, daysAfterNew, litFraction, normalize, observerAngle, phaseAngle, phaseAt, poeOf, shadowAzimuth, shadowDirection, shadowLen, shadowMeets, waxing, type SkyConfig } from "./sky.logic.ts";

const def = defineEngine({
  id: "sky@1",
  title: "Earth, Sun and Moon",
  subjects: ["science", "evs"],
  params: {
    scene: { type: "string", enum: ["daynight", "shadow", "phases"], doc: "default: from representation, else daynight" },
    mode: { type: "string", enum: ["explore", ...GENERIC_MODES], default: "explore", doc: "predict = a POE question first" },
    target: { type: "string", doc: "daynight: day|night|noon|midnight|sunrise|sunset; shadow: shortest|longest_morning|longest_afternoon|6..18; phases: new|waxing_crescent|first_quarter|waxing_gibbous|full|waning_gibbous|last_quarter|waning_crescent" },
    observer: { type: "string", enum: ["srinagar", "delhi", "mumbai", "chennai", "kanyakumari"], default: "delhi", doc: "shadow: where the stick stands" },
    dayOfYear: { type: "number", min: 1, max: 365, default: 80, doc: "shadow: date (80 ≈ 21 March)" },
    predict: { type: "boolean", default: false, doc: "POE question before the controls unlock" },
  },
  emits: ["sky.hour", "sky.moon", "poe.predicted"],
});

const T: Record<string, Tri> = {
  day: tri("day", "din", "दिन"), night: tri("night", "raat", "रात"), noon: tri("noon", "dopahar", "दोपहर"), midnight: tri("midnight", "aadhi raat", "आधी रात"),
  sunrise: tri("sunrise", "suryoday", "सूर्योदय"), sunset: tri("sunset", "suryast", "सूर्यास्त"),
  shortest: tri("the shortest shadow", "sabse chhoti chhaya", "सबसे छोटी छाया"), longest_morning: tri("the longest morning shadow", "subah ki sabse lambi chhaya", "सुबह की सबसे लंबी छाया"),
  longest_afternoon: tri("the longest evening shadow", "shaam ki sabse lambi chhaya", "शाम की सबसे लंबी छाया"),
  new: tri("new moon", "amavasya", "अमावस्या"), waxing_crescent: tri("thin crescent (growing)", "badhta hua patla chaand", "बढ़ता पतला चाँद"),
  first_quarter: tri("half moon (growing)", "badhta aadha chaand", "बढ़ता आधा चाँद"), waxing_gibbous: tri("almost full (growing)", "lagbhag poora (badhta)", "लगभग पूरा (बढ़ता)"),
  full: tri("full moon", "poornima", "पूर्णिमा"), waning_gibbous: tri("almost full (shrinking)", "lagbhag poora (ghat-ta)", "लगभग पूरा (घटता)"),
  last_quarter: tri("half moon (shrinking)", "ghat-ta aadha chaand", "घटता आधा चाँद"), waning_crescent: tri("thin crescent (shrinking)", "ghat-ta patla chaand", "घटता पतला चाँद"),
  morning: tri("morning", "subah", "सुबह"), evening: tri("evening", "shaam", "शाम"),
  make: tri("Make it", "Aisa karo:", "ऐसा करो:"), find: tri("Find", "Dhoondo:", "ढूँढो:"), show: tri("Show the", "Dikhao:", "दिखाओ:"),
  hour: tri("Time", "Samay", "समय"), moonPos: tri("Moon's position", "Chaand ki jagah", "चाँद की जगह"),
  q_daynight: tri("At 9 at night, is it day or night in India?", "Raat 9 baje India mein din hai ya raat?", "रात 9 बजे भारत में दिन है या रात?"),
  q_shadow: tri("When is a stick's shadow the shortest?", "Dande ki chhaya sabse chhoti kab hoti hai?", "डंडे की छाया सबसे छोटी कब होती है?"),
  q_phases: tri("About two weeks after a new moon, what do we see?", "Amavasya ke do hafte baad kya dikhta hai?", "अमावस्या के दो हफ़्ते बाद क्या दिखता है?"),
  days: tri("days after new moon", "din amavasya ke baad", "दिन अमावस्या के बाद"),
};
const s2 = (k: string, lang: string) => say(T[k] ?? tri(k, k, k), lang);
const clock = (h: number) => `${String(h).padStart(2, "0")}:00`;

function DayNight({ h, hl, ghost }: { h: number; hl: ReturnType<typeof useHl>; ghost: number | null }) {
  const a = (observerAngle(h) * Math.PI) / 180;
  const px = 200 + 70 * Math.cos(a);
  const py = 120 - 70 * Math.sin(a);
  return (
    <svg className="ek-svg sim-svg" viewBox="0 0 320 240" role="img" aria-label={`Earth at ${clock(h)}`}>
      <circle key={hl("sun").key} className={cls("sim-sun", hl("sun").cls)} cx={30} cy={120} r={24} data-target="sun" />
      {[60, 100, 140, 180].map((y) => <line key={y} className="sim-ray" x1={60} x2={120} y1={y} y2={y} />)}
      <circle key={hl("earth").key} className={cls("sim-earth", hl("earth").cls)} cx={200} cy={120} r={70} data-target="earth" />
      <path className="sim-night" d="M 200 50 A 70 70 0 0 1 200 190 Z" />
      {ghost !== null && <circle className="nl-ring" cx={200 + 70 * Math.cos((observerAngle(ghost) * Math.PI) / 180)} cy={120 - 70 * Math.sin((observerAngle(ghost) * Math.PI) / 180)} r={12} />}
      <circle key={hl("place").key} className={cls(hl("place").cls)} cx={px} cy={py} r={8} fill="#e0892f" stroke="#1f1a14" strokeWidth={2} data-target="place" />
      <text x={200} y={232} textAnchor="middle">N ⟲</text>
    </svg>
  );
}

function Shadow({ c, h, hl }: { c: SkyConfig; h: number; hl: ReturnType<typeof useHl> }) {
  const len = shadowLen(c, h);
  const up = Number.isFinite(len);
  const L = up ? Math.min(110, len * 40) : 0;
  const az = (shadowAzimuth(h, c) * Math.PI) / 180;
  const sx = 160 + L * Math.sin(az);
  const sy = 130 - L * Math.cos(az);
  const sunAz = ((shadowAzimuth(h, c) + 180) * Math.PI) / 180;
  return (
    <svg className="ek-svg sim-svg" viewBox="0 0 320 260" role="img" aria-label={`shadow at ${clock(h)}: ${up ? len.toFixed(2) + " m" : "no sun"}`}>
      <rect className="sim-ground" x={20} y={20} width={280} height={220} rx={12} opacity={0.35} />
      <text x={160} y={16} textAnchor="middle">N</text>
      <text x={312} y={134} textAnchor="end">E</text>
      <text x={8} y={134}>W</text>
      <text x={160} y={256} textAnchor="middle">S</text>
      {up && <circle key={hl("sun").key} className={cls("sim-sun", hl("sun").cls)} cx={160 + 120 * Math.sin(sunAz)} cy={130 - 105 * Math.cos(sunAz)} r={14} data-target="sun" />}
      {up && <line key={hl("shadow").key} className={cls("sim-shadow", hl("shadow").cls)} x1={160} y1={130} x2={sx} y2={sy} stroke="#2b2620" strokeWidth={10} strokeLinecap="round" data-target="shadow" />}
      <circle key={hl("stick").key} className={cls(hl("stick").cls)} cx={160} cy={130} r={7} fill="#1f1a14" data-target="stick" />
    </svg>
  );
}

function MoonPhase({ k, hl }: { k: number; hl: ReturnType<typeof useHl> }) {
  const a = (phaseAngle(k) * Math.PI) / 180;
  // Orbit view: Sun to the left, Moon at angle (180° + phase angle) around Earth.
  const mx = 210 + 70 * Math.cos(Math.PI + a);
  const my = 90 + 70 * Math.sin(Math.PI + a) * -1;
  // As seen from Earth: lit fraction f, lit on the right while waxing (northern hemisphere).
  const f = litFraction(k);
  const r = 34;
  const rx = Math.abs(1 - 2 * f) * r;
  const right = waxing(k);
  const lit =
    f < 0.02 ? "" :
    f > 0.98 ? `M 0 ${-r} A ${r} ${r} 0 1 1 0 ${r} A ${r} ${r} 0 1 1 0 ${-r}` :
    `M 0 ${-r} A ${r} ${r} 0 0 ${right ? 1 : 0} 0 ${r} A ${rx} ${r} 0 0 ${(f > 0.5) === right ? 1 : 0} 0 ${-r}`;
  return (
    <svg className="ek-svg sim-svg" viewBox="0 0 320 260" role="img" aria-label={`moon: ${phaseAt(k)}`}>
      <circle className="sim-sun" cx={24} cy={90} r={18} />
      <circle className="sim-zone" cx={210} cy={90} r={70} />
      <circle className="sim-earth" cx={210} cy={90} r={16} />
      <g key={hl("moon").key} className={hl("moon").cls} data-target="moon">
        <circle cx={mx} cy={my} r={10} className="sim-moon-dark" />
        <path d={`M ${mx} ${my - 10} A 10 10 0 0 0 ${mx} ${my + 10} Z`} className="sim-moon-lit" />
      </g>
      <g transform="translate(70 206)" data-view="from-earth">
        <circle r={r} className="sim-moon-dark" />
        {lit && <path d={lit} className="sim-moon-lit" />}
      </g>
      <text x={130} y={206}>↖ India</text>
    </svg>
  );
}

function Sky({ params, goal, lang, ageBand, highlight, revealed, api }: EngineProps) {
  const c = useMemo(() => normalize(params), [params]);
  useIssues(c.issues, api);
  const hl = useHl(highlight);
  const key = `${c.scene}|${c.target}|${c.latitude}|${c.dayOfYear}|${c.predict}`;
  const t = useTracker(api, key, { stuckAfterChanges: 40, stuckAfterWrong: 2 });
  const start = c.scene === "daynight" ? 12 : c.scene === "shadow" ? 8 : 0;
  const [s, setS] = useState({ key, v: start, predicted: !c.predict, verdict: null as boolean | null });
  if (s.key !== key) setS({ key, v: start, predicted: !c.predict, verdict: null });
  const poe = poeOf(c);

  const range = c.scene === "daynight" ? [0, 23] : c.scene === "shadow" ? [6, 18] : [0, 7];
  const move = (v: number) => {
    if (t.done || !s.predicted) return;
    setS({ ...s, v, verdict: null });
    if (c.scene === "phases") t.change("sky.moon", { position: v, phase: phaseAt(v), days: daysAfterNew(v) });
    else if (c.scene === "shadow") t.change("sky.hour", { hour: v, shadow_m: Number.isFinite(shadowLen(c, v)) ? Math.round(shadowLen(c, v) * 100) / 100 : null, direction: shadowDirection(v, c) });
    else t.change("sky.hour", { hour: v, state: dayNightState(v) });
  };
  const meets = (v: number) => (c.scene === "daynight" ? dayNightMeets(c.target, v) : c.scene === "shadow" ? shadowMeets(c, v) : phaseAt(v) === c.target);
  const check = () => {
    const ok = meets(s.v);
    setS({ ...s, verdict: ok });
    t.answer({ kind: `sky.${c.scene}`, target: c.target, value: s.v, state: c.scene === "phases" ? phaseAt(s.v) : c.scene === "daynight" ? dayNightState(s.v) : shadowDirection(s.v, c) }, ok, goal || `${c.scene} ${c.target}`);
  };
  const ghostHour = revealed && c.scene === "daynight" ? Array.from({ length: 24 }, (_, i) => i).find(meets) ?? null : null;
  const answerText = revealed ? (c.scene === "phases" ? s2(c.target, lang) : c.scene === "shadow" ? clock(Array.from({ length: 13 }, (_, i) => 6 + i).find(meets) ?? 12) : "") : "";
  const ask = c.scene === "daynight" ? `${s2("make", lang)} ${s2(c.target, lang)}` : c.scene === "shadow" ? `${s2("find", lang)} ${/^\d+$/.test(c.target) ? clock(Number(c.target)) : s2(c.target, lang)}` : `${s2("show", lang)} ${s2(c.target, lang)}`;
  return (
    <EngineRoot name="sky" ageBand={ageBand} mode={c.scene}>
      {c.predict && (
        <Poe question={s2(`q_${c.scene}`, lang)} options={poe.options.map((o) => ({ id: o, label: s2(o, lang) }))} correctId={poe.answer} lang={lang} revealed={revealed}
          onCommit={(id, ok) => {
            setS((x) => ({ ...x, predicted: true }));
            api.answer({ kind: "poe.predict", probe: poe.id, choice: id }, ok);
            api.interaction("poe.predicted", { probe: poe.id, choice: id });
          }} />
      )}
      <div aria-disabled={!s.predicted} style={s.predicted ? undefined : { opacity: 0.45, pointerEvents: "none" }} data-locked={!s.predicted}>
        <Prompt>{ask}</Prompt>
        {c.scene === "daynight" && <DayNight h={s.v} hl={hl} ghost={ghostHour} />}
        {c.scene === "shadow" && <Shadow c={c} h={s.v} hl={hl} />}
        {c.scene === "phases" && <MoonPhase k={s.v} hl={hl} />}
        <p className="ek-note" data-state>
          {c.scene === "phases" ? `${s2(phaseAt(s.v), lang)} · ${daysAfterNew(s.v)} ${s2("days", lang)}` : `${clock(s.v)} · ${c.scene === "daynight" ? s2(dayNightState(s.v), lang) : Number.isFinite(shadowLen(c, s.v)) ? `${shadowLen(c, s.v).toFixed(2)} m` : "—"}`}
          {answerText && <strong> · ✓ {answerText}</strong>}
        </p>
        <Stepper label={c.scene === "phases" ? s2("moonPos", lang) : s2("hour", lang)} value={s.v} min={range[0]} max={range[1]} onChange={move} target="hour" hl={hl("hour").cls} lang={lang}
          fmt={c.scene === "phases" ? (v) => `${v + 1}/8` : clock} />
        <div className="ek-row"><CheckBtn lang={lang} onClick={check} disabled={!s.predicted} hl={hl("check").cls} /></div>
      </div>
      <Verdict ok={s.verdict} lang={lang} />
    </EngineRoot>
  );
}

export const engine: EngineModule = { def, Component: Sky };
