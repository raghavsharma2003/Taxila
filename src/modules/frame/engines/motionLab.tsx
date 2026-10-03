// motion-lab@1 (v1 slice) — speed, friction, pendulum (science S10).
//   speed:    set the cart's speed (m/s); Run moves it for the given time; reach the flag exactly (d = v × t).
//   friction: give the same push on each surface (Run per surface), then say which lets the block go farthest.
//   pendulum: change length and mass, Run to time 10 swings; after a fair test of the asked variable (≥ 2 runs
//             changing only it) answer whether it makes the swing faster, slower or the same.
// With predict, a POE question comes first. Motion is one transform tween, skipped under reduced motion.
// Highlight: "cart", "flag", "speed", "surface:<s>", "bob", "length", "mass", "run", "check".
import { useMemo, useState } from "react";
import type { EngineModule, EngineProps } from "../engine.ts";
import { defineEngine, GENERIC_MODES } from "../kit/def.ts";
import { say, tri, W, type Tri } from "../kit/i18n.ts";
import { useTracker } from "../kit/tracker.ts";
import { Btn, Choices, cls, EngineRoot, Poe, Prompt, Stepper, useHl, useIssues, useRun, Verdict, useEngineError } from "../kit/ui.tsx";
import { fairTest, farthest, normalize, pendulumAnswer, period, stoppingDistance, travelled, type Surface } from "./motionLab.logic.ts";

const def = defineEngine({
  id: "motion-lab@1",
  title: "Motion lab",
  subjects: ["science", "evs"],
  params: {
    scene: { type: "string", enum: ["speed", "friction", "pendulum"], doc: "default: from representation, else speed" },
    mode: { type: "string", enum: ["explore", ...GENERIC_MODES], default: "explore", doc: "predict = a POE question first" },
    distance: { type: "number", min: 1, max: 200, default: 20, doc: "speed: metres to the flag" },
    time: { type: "number", min: 1, max: 20, default: 5, doc: "speed: seconds the cart runs" },
    v0: { type: "number", min: 1, max: 6, default: 3, doc: "friction: push speed m/s" },
    surfaces: { type: "array", doc: "friction: 2-3 of ice | wood | sand | carpet" },
    ask: { type: "string", enum: ["mass", "length"], default: "mass", doc: "pendulum: which variable the question is about" },
    predict: { type: "boolean", default: false, doc: "POE question before the lab unlocks" },
  },
  emits: ["mo.speed", "mo.run", "mo.surface", "mo.pendulum", "poe.predicted"],
});

const T: Record<string, Tri> = {
  speedAsk: tri("Set the speed so the cart stops at the flag", "Speed aisi rakho ki gaadi jhande par ruke", "गति ऐसी रखो कि गाड़ी झंडे पर रुके"),
  speed: tri("Speed (m/s)", "Speed (m/s)", "गति (m/s)"),
  frictionAsk: tri("Which surface lets the block slide farthest?", "Kis satah par block sabse door jaata hai?", "किस सतह पर ब्लॉक सबसे दूर जाता है?"),
  pendAsk_mass: tri("Does a heavier bob swing faster, slower or the same?", "Bhaari golak tez, dheere ya utna hi jhoolta hai?", "भारी गोलक तेज़, धीरे या उतना ही झूलता है?"),
  pendAsk_length: tri("Does a longer string swing faster, slower or the same?", "Lambi dori tez, dheere ya utna hi jhoolti hai?", "लंबी डोरी तेज़, धीरे या उतना ही झूलती है?"),
  fair: tri("Run it twice, changing only one thing", "Do baar chalao, sirf ek cheez badlo", "दो बार चलाओ, सिर्फ़ एक चीज़ बदलो"),
  length: tri("String (cm)", "Dori (cm)", "डोरी (cm)"),
  mass: tri("Bob (g)", "Golak (g)", "गोलक (g)"),
  faster: tri("faster", "tez", "तेज़"), slower: tri("slower", "dheere", "धीरे"), same: tri("the same", "utna hi", "उतना ही"),
  ice: tri("ice", "barf", "बर्फ़"), wood: tri("wood", "lakdi", "लकड़ी"), sand: tri("sand", "ret", "रेत"), carpet: tri("carpet", "kaleen", "कालीन"),
  swings: tri("time for one swing", "ek jhoole ka samay", "एक झूले का समय"),
};
const t2 = (k: string, lang: string) => say(T[k], lang);

function MotionLab({ params, goal, lang, ageBand, highlight, revealed, api }: EngineProps) {
  const c = useMemo(() => normalize(params), [params]);
  useIssues(c.issues, api);
  useEngineError(c.error, api);
  const hl = useHl(highlight);
  const key = `${c.scene}|${c.distance}|${c.time}|${c.v0}|${c.surfaces.join(",")}|${c.ask}|${c.predict}`;
  const t = useTracker(api, key, { stuckAfterChanges: 40 });
  const fresh = () => ({ key, speed: 1, ran: null as number | null, surface: c.surfaces[0] as Surface, tested: {} as Partial<Record<Surface, number>>, L: 50, m: 50, runs: [] as { L: number; m: number; T: number }[], pick: null as string | null, predicted: !c.predict, verdict: null as boolean | null });
  const [s, setS] = useState(fresh);
  if (s.key !== key) setS(fresh());
  const run = useRun(1200);

  const poe =
    c.scene === "speed" ? { q: tri(`To go ${c.distance} m in ${c.time} s, is ${c.distance / c.time} m/s enough?`, `${c.time} s mein ${c.distance} m jaane ke liye ${c.distance / c.time} m/s kaafi hai?`, `${c.time} s में ${c.distance} m जाने के लिए ${c.distance / c.time} m/s काफ़ी है?`), options: ["yes", "no"], answer: travelled(c.distance / c.time, c.time) >= c.distance ? "yes" : "no" } :
    c.scene === "friction" ? { q: T.frictionAsk, options: c.surfaces, answer: farthest(c) } :
    { q: T[`pendAsk_${c.ask}`], options: ["faster", "slower", "same"], answer: pendulumAnswer(c.ask) };

  const runSpeed = () => {
    if (!s.predicted || t.done) return;
    const d = travelled(s.speed, c.time);
    t.note("mo.run", { speed: s.speed, time: c.time, distance: d });
    run.start(() => {
      setS((x) => ({ ...x, ran: d, verdict: d === c.distance }));
      t.answer({ kind: "mo.speed", speed: s.speed, distance: d, flag: c.distance, over: d - c.distance }, d === c.distance, goal || `reach ${c.distance} m`);
    });
  };
  const runFriction = () => {
    if (!s.predicted || t.done) return;
    const d = stoppingDistance(c.v0, s.surface);
    run.start(() => {
      setS((x) => ({ ...x, ran: d, tested: { ...x.tested, [x.surface]: d } }));
      t.change("mo.surface", { surface: s.surface, distance_m: Math.round(d * 100) / 100 });
    });
  };
  const runPendulum = () => {
    if (!s.predicted || t.done) return;
    const T0 = period(s.L, s.m);
    run.start(() => {
      setS((x) => ({ ...x, runs: [...x.runs, { L: x.L, m: x.m, T: T0 }] }));
      t.change("mo.pendulum", { length_cm: s.L, mass_g: s.m, period_s: Math.round(T0 * 100) / 100 });
    });
  };
  const answer = (pick: string) => {
    let ok = false;
    if (c.scene === "friction") ok = pick === farthest(c);
    if (c.scene === "pendulum") ok = pick === pendulumAnswer(c.ask);
    setS({ ...s, pick, verdict: ok });
    t.answer({ kind: `mo.${c.scene}`, choice: pick, ...(c.scene === "friction" ? { tested: Object.keys(s.tested) } : { runs: s.runs.length, fair_test: fairTest(s.runs, c.ask) }) }, ok, goal || `${c.scene} question`);
  };

  const p = run.p;
  const canAnswer = c.scene === "friction" ? Object.keys(s.tested).length >= c.surfaces.length : c.scene === "pendulum" ? fairTest(s.runs, c.ask) : false;
  const last = s.runs.at(-1);
  return (
    <EngineRoot name="motion-lab" ageBand={ageBand} mode={c.scene}>
      {c.predict && (
        <Poe question={say(poe.q, lang)} options={poe.options.map((o) => ({ id: o, label: T[o] ? t2(o, lang) : o }))} correctId={poe.answer} lang={lang} revealed={revealed}
          onCommit={(id, ok) => {
            setS((x) => ({ ...x, predicted: true }));
            api.answer({ kind: "poe.predict", probe: `${c.scene}_poe`, choice: id }, ok);
            api.interaction("poe.predicted", { probe: `${c.scene}_poe`, choice: id });
          }} />
      )}
      <div data-locked={!s.predicted} style={s.predicted ? undefined : { opacity: 0.45, pointerEvents: "none" }}>
        {c.scene === "speed" && (
          <>
            <Prompt>{t2("speedAsk", lang)} <strong className="ek-math">{c.distance} m · {c.time} s</strong></Prompt>
            <svg className="ek-svg sim-svg" viewBox="0 0 340 90" role="img" aria-label={`track ${c.distance} m`}>
              <line className="sim-track" x1={10} x2={330} y1={70} y2={70} />
              {(() => {
                const scale = 280 / (c.distance * 1.5);
                const fx = 20 + c.distance * scale;
                const reach = (s.ran ?? 0) * p;
                const cx = Math.min(330, 20 + reach * scale);
                return (
                  <>
                    <g key={hl("flag").key} className={hl("flag").cls} data-target="flag"><line x1={fx} x2={fx} y1={30} y2={70} stroke="#1f1a14" strokeWidth={2} /><path d={`M ${fx} 30 l 16 6 l -16 6 z`} fill="#c0392b" /></g>
                    <g key={hl("cart").key} className={hl("cart").cls} style={{ transform: `translateX(${cx - 20}px)` }} data-target="cart">
                      <rect className="sim-body" x={8} y={50} width={24} height={14} rx={3} />
                      <circle cx={13} cy={66} r={4} /><circle cx={27} cy={66} r={4} />
                    </g>
                    <text x={fx} y={86} textAnchor="middle">{c.distance} m</text>
                  </>
                );
              })()}
            </svg>
            {s.ran !== null && <p className="ek-note" data-distance={s.ran}>{s.speed} m/s × {c.time} s = {s.ran} m</p>}
            <Stepper label={t2("speed", lang)} value={s.speed} min={1} max={20} onChange={(v) => { setS({ ...s, speed: v, verdict: null }); t.change("mo.speed", { speed: v }); }} target="speed" hl={hl("speed").cls} lang={lang} />
            <div className="ek-row"><Btn kind="primary" target="run" hl={hl("run").cls} onClick={runSpeed} disabled={run.running || !!c.error}>{say(W.play, lang)}</Btn></div>
          </>
        )}
        {c.scene === "friction" && (
          <>
            <Prompt>{t2("frictionAsk", lang)}</Prompt>
            <svg className="ek-svg sim-svg" viewBox="0 0 340 80" role="img" aria-label={`block on ${s.surface}`}>
              <rect className={`sim-surface-${s.surface}`} x={10} y={50} width={320} height={22} stroke="#1f1a14" />
              {(() => {
                const d = (s.ran ?? 0) * p;
                const max = Math.max(...c.surfaces.map((x) => stoppingDistance(c.v0, x)));
                const x = 20 + (d / max) * 280;
                return <rect key={hl("block").key} className={cls("sim-body", hl("block").cls)} x={0} y={30} width={22} height={20} style={{ transform: `translateX(${x}px)` }} data-target="block" />;
              })()}
            </svg>
            <div className="ek-row is-wrap" role="group" aria-label="surface">
              {c.surfaces.map((x) => (
                <Btn key={x} target={`surface:${x}`} pressed={s.surface === x} hl={hl(`surface:${x}`).cls} onClick={() => setS({ ...s, surface: x, ran: null })}>
                  {t2(x, lang)}{s.tested[x] !== undefined && ` · ${s.tested[x]!.toFixed(1)} m`}
                </Btn>
              ))}
            </div>
            <div className="ek-row"><Btn kind="primary" target="run" hl={hl("run").cls} onClick={runFriction} disabled={run.running}>{say(W.play, lang)}</Btn></div>
            {canAnswer && <Choices options={c.surfaces.map((x) => ({ id: x, label: t2(x, lang) }))} selected={s.pick} onPick={answer} answerIds={revealed ? [farthest(c)] : []} />}
          </>
        )}
        {c.scene === "pendulum" && (
          <>
            <Prompt>{t2(`pendAsk_${c.ask}`, lang)}</Prompt>
            <svg className="ek-svg sim-svg" viewBox="0 0 240 200" style={{ maxWidth: 260 }} role="img" aria-label={`pendulum ${s.L} cm, ${s.m} g`}>
              <line x1={60} x2={180} y1={10} y2={10} className="sim-track" />
              {(() => {
                const len = 40 + s.L * 1.3;
                const swing = run.running ? Math.sin(p * Math.PI * 2 * 3) * 18 : 0;
                const a = (swing * Math.PI) / 180;
                const bx = 120 + len * Math.sin(a);
                const by = 10 + len * Math.cos(a);
                return (
                  <>
                    <line className="sim-string" x1={120} y1={10} x2={bx} y2={by} />
                    <circle key={hl("bob").key} className={cls("sim-body", hl("bob").cls)} cx={bx} cy={by} r={6 + s.m / 25} data-target="bob" />
                  </>
                );
              })()}
            </svg>
            {last && <p className="ek-note" data-period={last.T.toFixed(2)}>{t2("swings", lang)}: {last.T.toFixed(2)} s ({last.L} cm, {last.m} g)</p>}
            <div className="ek-row">
              <Stepper label={t2("length", lang)} value={s.L} min={10} max={100} step={10} onChange={(v) => setS({ ...s, L: v })} target="length" hl={hl("length").cls} lang={lang} />
              <Stepper label={t2("mass", lang)} value={s.m} min={50} max={200} step={50} onChange={(v) => setS({ ...s, m: v })} target="mass" hl={hl("mass").cls} lang={lang} />
            </div>
            <div className="ek-row"><Btn kind="primary" target="run" hl={hl("run").cls} onClick={runPendulum} disabled={run.running}>{say(W.play, lang)}</Btn></div>
            {!canAnswer ? <p className="ek-note">{t2("fair", lang)}</p> : (
              <Choices options={["faster", "slower", "same"].map((x) => ({ id: x, label: t2(x, lang) }))} selected={s.pick} onPick={answer} answerIds={revealed ? [pendulumAnswer(c.ask)] : []} />
            )}
          </>
        )}
      </div>
      <Verdict ok={s.verdict} lang={lang} />
    </EngineRoot>
  );
}

export const engine: EngineModule = { def, Component: MotionLab };
