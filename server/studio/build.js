// The build orchestrator (LIVE-STUDIO §3.0, §3.5-3.8, D5, D6, S3): a RACE of two routed builders (plus an opportunistic
// third), each streaming through the stream guard, fixed by the deterministic fixers, judged by the gate, repaired at
// most twice from the gate's own failure report; the first build that passes every hard check wins and the others are
// cancelled. Deadlines, a stall watchdog (azure.js chatStream), the 429 arm (taxila-codex) and Q8 on the strings table
// in parallel with the build. Every call is on the background quota lane and child-free.
//
// buildRace(plan, opts) → { ok, winner, records, ms, usd, reason }
//   winner = { arm, html, sha256, gate, record } (html is exactly the bytes that passed the gate: the frame reveals those)
//   records = one BuildRecord per arm (telemetry.js), also recorded to the telemetry sink
import { archetype, buildPrompt, stringKeys } from "./archetypes/index.js";
import { runBuilder } from "./builders/index.js";
import { repairPrompt, shouldDrop, memoryFor, MAX_REPAIRS } from "./repair.js";
import { routeFor, breaker } from "./router.js";
import { gateClient } from "./qa/pool.js";
import { buildRecord, record, sha256 } from "./telemetry.js";
import { PLAYERS } from "./qa/players/index.js";

/**
 * @param {import("../../shared/studio").BuildPlan} plan
 * @param {{ route?: any, gate?: (job: object) => Promise<any>, band?: string, lang?: string, deadlineMs?: number, signal?: AbortSignal,
 *   onPartial?: (arm: string, html: string) => void, onStatus?: (s: { state: string, arm?: string, round?: number, etaMs?: number }) => void,
 *   q8?: () => Promise<{ ok: boolean }>, repairs?: number, opportunistic?: boolean, identity?: string, trace?: object[] }} [o]
 */
export async function buildRace(plan, o = {}) {
  const t0 = performance.now();
  const a = archetype(plan.archetype);
  const route = o.route ?? routeFor(plan.archetype);
  const gate = o.gate ?? ((job) => gateClient().gate(job));
  const repairs = Math.min(o.repairs ?? MAX_REPAIRS, MAX_REPAIRS);
  const band = o.band ?? "B3";
  const ctl = new AbortController();
  let reason = "";
  const stop = (why) => { if (!reason) reason = why; ctl.abort(); };
  const deadline = setTimeout(() => stop("deadline"), o.deadlineMs ?? route.deadlineMs ?? 120_000);
  const onExt = () => stop("cancelled");
  if (o.signal) { if (o.signal.aborted) stop("cancelled"); else o.signal.addEventListener("abort", onExt, { once: true }); }
  const status = (s) => { try { o.onStatus?.(s); } catch { /* status is advisory */ } };

  const keys = stringKeys(a, plan.params);
  const seam = PLAYERS[a.player]?.seam ?? [];
  const base = buildPrompt(a, { params: plan.params, band, craft: plan.craft, memory: memoryFor(a.id) });
  const arms = [...route.arms.filter((x) => !x.opportunistic).slice(0, route.race ?? 2), ...(o.opportunistic === false ? [] : route.arms.filter((x) => x.opportunistic))];
  let winner = null, used429 = false;
  const records = [];
  status({ state: "building", etaMs: route.leadMs ?? 90_000 });

  async function runArm(arm0) {
    let arm = arm0;
    const rounds = [], gates = [];
    let prompt = base, lastGate = null;
    for (let round = 0; round <= repairs && !ctl.signal.aborted; round++) {
      const b = await runBuilder(arm, prompt, { keys, seam, signal: ctl.signal, trace: o.trace,
        onPartial: o.onPartial ? (html) => o.onPartial(arm.name ?? arm.dep, html) : undefined });
      const r = { ...b, qaMs: 0 };
      rounds.push(r);
      if (!b.ok && b.status === 429 && !used429 && route.fallback429 && !ctl.signal.aborted) {
        // a 429 on a routed arm: the codex arm takes its place once per race (MODEL-ROUTER §0); the round is not counted
        used429 = true; arm = { ...route.fallback429 }; round--; continue;
      }
      if (ctl.signal.aborted) break;
      if (!b.html || (b.error && b.error !== "length")) break;     // garbage, filter, stall, timeout: this arm is out
      status({ state: round ? "repairing" : "checking", arm: arm.name ?? arm.dep, round });
      const tg = performance.now();
      const g = await gate({ archetypeId: a.id, fragment: b.html, params: plan.params, strings: plan.strings, band, lang: o.lang, fixed: true, seed: round + 1 });
      r.qaMs = Math.round(performance.now() - tg);
      lastGate = g; gates.push(g);
      if (g.unavailable) { stop("gate_unavailable"); break; }
      if (g.pass) {
        if (!winner && !ctl.signal.aborted) {
          winner = { arm: arm.name ?? arm.dep, html: b.html, sha256: sha256(b.html), gate: g };
          status({ state: "ready", arm: winner.arm });
          stop("won");
        }
        return finish(arm, rounds, true, g);
      }
      if (round >= repairs || shouldDrop(gates)) break;
      prompt = repairPrompt(base, { html: b.html, gate: g, hints: b.hints, archetypeId: a.id, scriptError: b.scriptError });
    }
    return finish(arm, rounds, false, lastGate);
  }
  function finish(arm, rounds, passed, g) {
    const rec = buildRecord({ plan, identity: o.identity ?? "", arm, rounds, passed, gate: g, startedAt: t0 });
    record({ type: "studio_build", ...rec });
    if (o.keepHtml) rec.html = rounds.at(-1)?.html ?? "";       // the bench keeps every arm's last file for diagnosis
    records.push(rec);
    breaker.spend(rec.usd);
    return rec;
  }

  const q8 = o.q8 ? o.q8().then((r) => { if (!r?.ok) stop("q8"); }).catch(() => stop("q8")) : Promise.resolve();
  await Promise.allSettled([...arms.map(runArm), q8]);
  clearTimeout(deadline);
  o.signal?.removeEventListener?.("abort", onExt);
  if (reason === "q8") winner = null;               // a table that failed Q8 never reaches a child, even if a build passed
  const ok = !!winner;
  breaker.result(ok);
  const usd = +records.reduce((s, r) => s + r.usd, 0).toFixed(5);
  const ms = Math.round(performance.now() - t0);
  if (winner) winner.record = records.find((r) => r.buildSha === winner.sha256) ?? null;
  if (!ok) status({ state: "failed" });
  record({ type: "studio_race", planId: plan.planId, archetype: a.id, ok, ms, usd, reason: ok ? "won" : reason || "all_failed", arms: records.map((r) => `${r.arm}:${r.gate.pass ? "pass" : "fail"}`) });
  return { ok, winner, records, ms, usd, reason: ok ? "won" : reason || "all_failed" };
}
