// water-cycle@1 — follow a drop round the cycle, heat ice to steam, and look after groundwater (science S12).
//   cycle:       a drop starts in the sea. Turn the Sun on and tap the process that moves it on (evaporate →
//                condense → rain → flow → flow); a process that cannot happen where the drop is changes nothing
//                and is logged (rain_from_vapour, condense_in_sea …). goal_met when the loop closes.
//   states:      add or take away heat (−/+ 1 kJ, ±5) and watch temperature and state; the temperature stays
//                flat while ice melts and while water boils. Check at the target state (default: boiling).
//                With predict: "while it boils, does the temperature rise, stay or fall?" first.
//   groundwater: choose land cover and pumping, run 10 years, keep the borewell wet while pumping enough.
// Schematic only: no maps, no borders. Highlight: "drop", "sun", "proc:<p>", "heat", "thermometer",
// "pump", "cover:<c>", "well", "run", "check".
import { useMemo, useState } from "react";
import type { EngineModule, EngineProps } from "../engine.ts";
import { defineEngine, GENERIC_MODES } from "../kit/def.ts";
import { say, tri, W, type Tri } from "../kit/i18n.ts";
import { useTracker } from "../kit/tracker.ts";
import { Btn, CheckBtn, Choices, cls, EngineRoot, Poe, Prompt, Stepper, useHl, useIssues, useRun, Verdict } from "../kit/ui.tsx";
import {
  applyProcess, boilingTrend, COVERS, groundwaterMeets, loopClosed, MAX_KJ, normalize, PROCESSES, START_TABLE_M, stateAt, statesMeets, STEP_KJ, tableSeries, WELL_DEPTH_M, wellDry,
  type Cover, type Place, type Process,
} from "./waterCycle.logic.ts";

const def = defineEngine({
  id: "water-cycle@1",
  title: "Water cycle",
  subjects: ["science", "evs"],
  params: {
    scene: { type: "string", enum: ["cycle", "states", "groundwater"], doc: "default: from representation, else cycle" },
    mode: { type: "string", enum: ["explore", ...GENERIC_MODES], default: "explore", doc: "predict = a POE question first (states)" },
    target: { type: "string", doc: "states: ice | melting | water | boiling | steam" },
    rain: { type: "number", min: 0, max: 3, default: 2, doc: "groundwater: this season's rain (0-3)" },
    pumpNeed: { type: "number", min: 1, max: 3, default: 2, doc: "groundwater: pumping the village needs (0-3)" },
    landcover: { type: "string", enum: ["forest", "farm", "city"], default: "city", doc: "groundwater: starting land cover" },
    predict: { type: "boolean", default: false, doc: "POE question before the lab unlocks" },
  },
  emits: ["wc.process", "wc.sun", "wc.heat", "wc.cover", "wc.pump", "wc.run", "poe.predicted"],
});

const T: Record<string, Tri> = {
  cycleAsk: tri("Take the drop all the way round and back to the sea", "Boond ko poora chakkar lagwa kar samudra tak wapas lao", "बूँद को पूरा चक्कर लगवाकर समुद्र तक वापस लाओ"),
  sun: tri("Sun", "Suraj", "सूरज"),
  evaporate: tri("evaporate", "vaashp bano", "वाष्प बनो"), condense: tri("condense", "sanghanit ho", "संघनित हो"), rain: tri("rain", "barso", "बरसो"), flow: tri("flow", "baho", "बहो"),
  sea: tri("sea", "samudra", "समुद्र"), vapour: tri("water vapour", "jalvaashp", "जलवाष्प"), cloud: tri("cloud", "baadal", "बादल"), ground: tri("land", "zameen", "ज़मीन"), river: tri("river", "nadi", "नदी"),
  statesAsk: tri("Heat it until it is", "Itna garam karo ki yeh ho jaaye:", "इतना गरम करो कि यह हो जाए:"),
  ice: tri("ice", "barf", "बर्फ़"), melting: tri("melting", "pighal rahi", "पिघल रही"), water: tri("water", "paani", "पानी"), boiling: tri("boiling", "ubal raha", "उबल रहा"), steam: tri("steam", "bhaap", "भाप"),
  heat: tri("Heat (kJ)", "Garmi (kJ)", "ऊष्मा (kJ)"),
  q_states: tri("While water boils, its temperature…", "Paani ubalte waqt uska taapmaan…", "पानी उबलते समय उसका तापमान…"),
  rises: tri("keeps rising", "badhta rehta", "बढ़ता रहता"), stays: tri("stays the same", "wahi rehta", "वही रहता"), falls: tri("falls", "girta", "गिरता"),
  gwAsk: tri("Pump enough water and keep the borewell wet for 10 years", "Kaafi paani nikalo aur 10 saal borewell sookhne mat do", "काफ़ी पानी निकालो और 10 साल बोरवेल सूखने मत दो"),
  pump: tri("Pumping", "Pump", "पंप"), forest: tri("forest", "jungle", "जंगल"), farm: tri("farms", "khet", "खेत"), city: tri("city", "shehar", "शहर"),
  dry: tri("The borewell ran dry", "Borewell sookh gaya", "बोरवेल सूख गया"), wet: tri("The borewell still has water", "Borewell mein abhi paani hai", "बोरवेल में अभी पानी है"),
  need: tri("needs at least", "kam se kam chahiye", "कम से कम चाहिए"),
};
const w = (k: string, lang: string) => say(T[k], lang);

const POS: Record<Place, [number, number]> = { sea: [70, 210], vapour: [110, 120], cloud: [190, 50], ground: [270, 150], river: [200, 205] };

function WaterCycle({ params, goal, lang, ageBand, highlight, revealed, api }: EngineProps) {
  const c = useMemo(() => normalize(params), [params]);
  useIssues(c.issues, api);
  const hl = useHl(highlight);
  const key = `${c.scene}|${c.target}|${c.rain}|${c.pumpNeed}|${c.landcover}|${c.predict}`;
  const t = useTracker(api, key, { stuckAfterChanges: 30 });
  const fresh = () => ({ key, at: "sea" as Place, path: ["sea"] as Place[], sun: false, kJ: 0, cover: c.landcover as Cover, pump: 0, series: null as number[] | null, predicted: !(c.predict && c.scene === "states"), verdict: null as boolean | null });
  const [s, setS] = useState(fresh);
  if (s.key !== key) setS(fresh());
  const run = useRun(1500);

  const proc = (pr: Process) => {
    if (t.done) return;
    const r = applyProcess(s.at, pr, s.sun);
    const path = r.ok ? [...s.path, r.to] : s.path;
    setS({ ...s, at: r.to, path });
    t.change("wc.process", { process: pr, from: s.at, to: r.to, ok: r.ok, ...(r.misc && { misc: r.misc }) });
    if (r.ok && loopClosed(path)) t.goal(goal || "water cycle loop");
  };
  const heat = (kJ: number) => {
    if (t.done || !s.predicted) return;
    setS({ ...s, kJ, verdict: null });
    const st = stateAt(kJ);
    t.change("wc.heat", { kJ, temp_c: Math.round(st.tempC * 10) / 10, state: st.state });
  };
  const checkStates = () => {
    const ok = statesMeets(c.target, s.kJ);
    const st = stateAt(s.kJ);
    setS({ ...s, verdict: ok });
    t.answer({ kind: "wc.states", target: c.target, state: st.state, temp_c: Math.round(st.tempC * 10) / 10, kJ: s.kJ }, ok, goal || `make ${c.target}`);
  };
  const runYears = () => {
    if (t.done) return;
    const series = tableSeries(c.rain, s.pump, s.cover);
    t.note("wc.run", { cover: s.cover, pump: s.pump, rain: c.rain, end_depth_m: series.at(-1), dry: wellDry(series) });
    run.start(() => {
      setS((x) => ({ ...x, series, verdict: groundwaterMeets(c, s.cover, s.pump) }));
      t.answer({ kind: "wc.groundwater", cover: s.cover, pump: s.pump, end_depth_m: series.at(-1), dry: wellDry(series), pumped_enough: s.pump >= c.pumpNeed }, groundwaterMeets(c, s.cover, s.pump), goal || "keep the borewell wet");
    });
  };

  return (
    <EngineRoot name="water-cycle" ageBand={ageBand} mode={c.scene}>
      {c.scene === "cycle" && (
        <>
          <Prompt>{w("cycleAsk", lang)}</Prompt>
          <svg className="ek-svg sim-svg" viewBox="0 0 320 240" role="img" aria-label={`drop in the ${s.at}`}>
            <rect x={0} y={190} width={150} height={50} className="sim-water" />
            <path d="M150 240 L150 190 L230 130 L320 110 L320 240 Z" className="sim-ground" />
            <path d="M160 238 Q 200 200 245 160" stroke="#7fb8e6" strokeWidth={8} fill="none" />
            <ellipse cx={190} cy={50} rx={46} ry={20} className="sim-cloud" />
            <circle key={hl("sun").key} className={cls("sim-sun", hl("sun").cls)} cx={36} cy={36} r={20} opacity={s.sun ? 1 : 0.3} data-target="sun" />
            {(Object.keys(POS) as Place[]).map((p) => <circle key={p} className={cls("sim-zone", s.at === p && "is-here")} cx={POS[p][0]} cy={POS[p][1]} r={22} data-place={p} />)}
            <circle key={hl("drop").key} className={cls("sim-drop", hl("drop").cls)} cx={POS[s.at][0]} cy={POS[s.at][1]} r={9} data-target="drop" />
            {revealed && <path d="M70 200 L110 130 L185 60 L265 145 L205 200 L80 205" fill="none" stroke="#1f6f5c" strokeWidth={2} strokeDasharray="5 4" />}
          </svg>
          <p className="ek-note" data-at={s.at}>{w(s.at, lang)}</p>
          <div className="ek-row is-wrap">
            <Btn target="sun" pressed={s.sun} hl={hl("sun").cls} onClick={() => { setS({ ...s, sun: !s.sun }); t.note("wc.sun", { on: !s.sun }); }}>☀ {w("sun", lang)}</Btn>
            {PROCESSES.map((p) => <Btn key={p} target={`proc:${p}`} hl={hl(`proc:${p}`).cls} onClick={() => proc(p)}>{w(p, lang)}</Btn>)}
          </div>
        </>
      )}
      {c.scene === "states" && (
        <>
          {c.predict && (
            <Poe question={w("q_states", lang)} options={["rises", "stays", "falls"].map((o) => ({ id: o, label: w(o, lang) }))} correctId={boilingTrend()} lang={lang} revealed={revealed}
              onCommit={(id, ok) => {
                setS((x) => ({ ...x, predicted: true }));
                api.answer({ kind: "poe.predict", probe: "boiling_temperature", choice: id }, ok);
                api.interaction("poe.predicted", { probe: "boiling_temperature", choice: id });
              }} />
          )}
          <div data-locked={!s.predicted} style={s.predicted ? undefined : { opacity: 0.45, pointerEvents: "none" }}>
            <Prompt>{w("statesAsk", lang)} <strong className="ek-math">{w(c.target, lang)}</strong></Prompt>
            {(() => {
              const st = stateAt(s.kJ);
              const iceH = 60 * (1 - st.meltedFrac);
              const waterH = 70 * st.meltedFrac * (1 - st.boiledFrac);
              const thermoY = 200 - Math.max(0, Math.min(170, (st.tempC + 10) * 1.4));
              return (
                <svg className="ek-svg sim-svg" viewBox="0 0 320 230" role="img" aria-label={`${st.state}, ${Math.round(st.tempC)} °C`}>
                  <path d="M60 60 L60 200 L180 200 L180 60" className="ms-body" fill="none" />
                  <rect x={62} y={198 - waterH} width={116} height={waterH} className="sim-water" />
                  {iceH > 0 && <rect x={80} y={198 - waterH - iceH} width={80} height={iceH} fill="#e3f4fb" stroke="#1f5f99" strokeWidth={2} />}
                  {st.state === "boiling" && [80, 110, 140].map((x) => <circle key={x} cx={x} cy={190 - waterH / 2} r={5} fill="none" stroke="#fff" strokeWidth={2} />)}
                  {st.boiledFrac > 0 && <path d="M90 50 q 10 -15 0 -30 M120 50 q 10 -15 0 -30 M150 50 q 10 -15 0 -30" stroke="#8c96a3" strokeWidth={3} fill="none" />}
                  <rect x={80} y={204} width={80} height={12} fill="#e8743b" opacity={Math.min(1, s.kJ / 10)} />
                  <g key={hl("thermometer").key} className={hl("thermometer").cls} data-target="thermometer">
                    <rect x={238} y={20} width={14} height={184} rx={7} className="ms-body" />
                    <rect x={242} y={thermoY} width={6} height={204 - thermoY} className="sim-thermo" />
                    <text x={262} y={36}>100°</text><text x={262} y={190}>0°</text>
                  </g>
                  <text x={120} y={226} textAnchor="middle" data-temp={Math.round(st.tempC * 10) / 10}>{Math.round(st.tempC * 10) / 10} °C · {w(st.state, lang)}</text>
                </svg>
              );
            })()}
            <Stepper label={w("heat", lang)} value={s.kJ} min={0} max={MAX_KJ} step={STEP_KJ} big={5} onChange={heat} target="heat" hl={hl("heat").cls} lang={lang} />
            <div className="ek-row"><CheckBtn lang={lang} onClick={checkStates} disabled={!s.predicted} hl={hl("check").cls} /></div>
          </div>
        </>
      )}
      {c.scene === "groundwater" && (
        <>
          <Prompt>{w("gwAsk", lang)} <span className="ek-note">({w("pump", lang)} {w("need", lang)} {c.pumpNeed})</span></Prompt>
          {(() => {
            const series = s.series;
            const shown = series ? series[Math.min(series.length - 1, Math.floor(run.p * series.length))] : START_TABLE_M;
            const y = (d: number) => 40 + Math.min(40, d) * 4.5;
            return (
              <svg className="ek-svg sim-svg" viewBox="0 0 320 240" role="img" aria-label={`water table ${shown} m below ground`}>
                <rect x={0} y={40} width={320} height={200} fill="#a47551" opacity={0.35} />
                <rect x={0} y={y(shown)} width={320} height={240 - y(shown)} className="sim-water" opacity={0.6} />
                <line x1={0} x2={320} y1={40} y2={40} stroke="#3f7a1e" strokeWidth={6} />
                <g key={hl("well").key} className={hl("well").cls} data-target="well">
                  <rect x={150} y={20} width={10} height={y(WELL_DEPTH_M) - 20} fill="#9aa3af" stroke="#1f1a14" />
                </g>
                <text x={166} y={y(WELL_DEPTH_M)}>{WELL_DEPTH_M} m</text>
                <text x={8} y={y(shown) - 4} data-depth={shown}>{shown} m</text>
              </svg>
            );
          })()}
          {s.series && <p className="ek-note" data-dry={wellDry(s.series)}>{w(wellDry(s.series) ? "dry" : "wet", lang)}</p>}
          <Choices options={COVERS.map((x) => ({ id: x, label: w(x, lang) }))} selected={s.cover} hlOf={(tg) => hl(tg.replace("choice:", "cover:"))}
            answerIds={revealed ? COVERS.filter((x) => groundwaterMeets(c, x, c.pumpNeed)) : []}
            onPick={(cover) => { setS({ ...s, cover: cover as Cover, series: null, verdict: null }); t.change("wc.cover", { cover }); }} />
          <Stepper label={w("pump", lang)} value={s.pump} min={0} max={3} onChange={(pump) => { setS({ ...s, pump, series: null, verdict: null }); t.change("wc.pump", { pump }); }} target="pump" hl={hl("pump").cls} lang={lang} />
          <div className="ek-row"><Btn kind="primary" target="run" hl={hl("run").cls} onClick={runYears} disabled={run.running}>{say(W.play, lang)}</Btn></div>
        </>
      )}
      <Verdict ok={s.verdict} lang={lang} />
    </EngineRoot>
  );
}

export const engine: EngineModule = { def, Component: WaterCycle };
