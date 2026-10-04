// OWNER TEST 2026-10-04 item 1 — "Game grading is nonsense": activity / game answers graded wrong (right marked wrong
// or vice versa). Owner intent: every module's grading checked against the VERIFIED key with randomized correct /
// incorrect / partial inputs; 0 wrong grades.
//
// A. Real lessons (API; typed and spoken lanes), one per bindable engine (the topic with the most item-bound plans for
//    it, from shared/engine-catalog.js over data/kits — the files production ships). On every kit item the teacher
//    poses, the child answers at random: right, right with filler, wrong, or half of a multi-part key. On every activity
//    bound to the item on the card, module-only answers are sent: an honest wrong value, a wrong value whose frame claim
//    says correct:true, and the right value whose claim says correct:false — the SERVER's verdict must follow the VALUE
//    against the key, never the frame's claim (F1). The teacher's words must agree with the verdict (F2/F3: no tick or
//    praise on not_yet, no "galti hui" on correct).
// B. The frame (Chromium, production /modules.html, routed): every engine in the catalog with item-bound plans built by
//    the catalog itself from kit items, plus every mount the Director sent in A, is played with deliberate (key, wrong,
//    equivalent form) and seeded random taps; each commit's `correct` claim is compared with an independent check of
//    the value it committed (plan key = kit key; compare questions from first principles; scene probes from their
//    expression). A mount that shows a Check that no tap sequence can commit is an unanswerable activity (F4): a FAIL.
// Acceptance: 0 wrong grades in A and B; every bound engine yields ≥ 1 verifiable commit; 0 unanswerable activities.
//
// Run: NODE_USE_ENV_PROXY=1 node tests/prod/owner-1-grading.mjs [--base URL] [--seed N] [--topics t1,t2] [--turns 18] [--no-browser]
import { readFileSync } from "fs";
import { join } from "path";
import { arg, flag, withTestAccount, ok, warn, done, BASE, SEED, rnd, pick, shuffle, PERSONAS, GREET, freshChild, openLesson, answersFor, kitOf, itemOf, allKitTopics,
  numOf, FRAC, norm, RX, compact, save, tally, browserOn, launchRouted, ROOT } from "./_owner.mjs";

const TURNS = Number(arg("turns", 18));
const { ENGINES, planEngine } = await import("../../shared/engine-catalog.js");
const TOPIC_MAP = JSON.parse(readFileSync(join(ROOT, "shared", "engine-topic-map.json"), "utf8"));
const ITEM_KINDS = new Set(["practice", "retrieval", "near_transfer", "far_transfer", "predict", "contrast", "error_spot"]);

// ───────────────────────────── the plans the catalog binds (truth source for coverage) ─────────────────────────────
const boundPlans = [];   // { engine, topicId, item, plan }
for (const topicId of allKitTopics()) {
  if (!TOPIC_MAP[topicId]) continue;
  let kit; try { kit = kitOf(topicId); } catch { continue; }
  for (const item of kit.items) {
    if (!ITEM_KINDS.has(item.kind)) continue;
    const predict = ["predict", "contrast", "translate_rep"].includes(item.kind);
    const plan = planEngine({ kit, item, lang: "english", mode: predict ? "predict" : "show", topicMap: TOPIC_MAP });
    if (plan?.bindItem) boundPlans.push({ engine: plan.engine, topicId, item, plan });
  }
}
const engineTopics = {};
for (const b of boundPlans) { (engineTopics[b.engine] ??= {}); engineTopics[b.engine][b.topicId] = (engineTopics[b.engine][b.topicId] ?? 0) + 1; }
const TOPICS = arg("topics", null)?.split(",") ?? Object.values(engineTopics).map((ts) => Object.entries(ts).sort((a, b) => b[1] - a[1])[0][0]);
console.log(`owner-1 against ${BASE}, seed ${SEED}; bindable engines: ${Object.keys(engineTopics).join(", ")}; lesson topics: ${TOPICS.join(", ")}`);

const classOf = (topicId) => Number(topicId.match(/^c(\d+)/)[1]);
const personaFor = (topicId, i) => {
  const c = classOf(topicId);
  const lang = ["hinglish", "english", "hindi"][i % 3];
  return { name: ["Aarav", "Meher", "Ishaan", "Zoya", "Golu", "Kabir"][i % 6], classLevel: c, lang, interests: ["cricket"], style: lang === "english" ? "english" : lang === "hindi" ? "hindi" : "hinglish", topics: [topicId] };
};

// ───────────────────────────── A. real lessons ─────────────────────────────
const gradeRows = [];     // typed answers: { topicId, itemId, truth, verdict, wrongGrade, words }
const moduleRows = [];    // module answers
const directorMounts = [];
const transcripts = [];

function wrongValueOf(keyV) {
  const s = String(keyV);
  const f = s.match(FRAC);
  if (f) return `${f[2]}/${Math.max(1, Number(f[1]) + 1)}` === s ? `${Number(f[1]) + 1}/${f[2]}` : `${f[2]}/${Math.max(1, Number(f[1]) + 1)}`;
  const n = numOf(s);
  return n != null ? String(n + pick([1, 2, 10])) : "xyz";
}

await withTestAccount(async ({ api }) => {
  for (const [i, topicId] of TOPICS.entries()) {
    const persona = personaFor(topicId, i);
    const spoken = i % 2 === 1;
    const child = await freshChild(api, persona);
    let kit; try { kit = kitOf(topicId); } catch { ok(false, `no kit for ${topicId}`); continue; }
    let L;
    try { L = await openLesson(api, child, { topicId, spoken, persona }); } catch (e) { ok(false, `${topicId}: lesson start failed: ${e.message}`); continue; }
    const mounted = new Map();
    const track = (r) => { for (const c of r?.moduleCommands ?? []) { if (c.op === "mount") { mounted.set(c.moduleId, c); directorMounts.push({ topicId, lang: persona.lang, classLevel: persona.classLevel, ...c }); } else if (c.op === "unmount") mounted.delete(c.moduleId); } };
    track(L.opening);
    let probedBound = 0;
    await L.turn(GREET[persona.style] ?? GREET.hinglish, { kind: "greet" }); track(L.last);
    for (let t = 0; t < TURNS && !L.ended; t++) {
      const askId = L.last?.ui?.ask?.itemId;
      const item = itemOf(kit, askId);
      // an activity bound to the item on the card: module-only answers first (the value decides, never the claim)
      const bound = item && [...mounted.values()].find((c) => (c.params?.itemId === item.id || c.goal === `item:${item.id}` || c.goal === `g1:${item.id}`) && !c._probed);
      if (bound && probedBound < 2) {
        bound._probed = true; probedBound++;
        let steps;
        if (bound.engine === "scene@1") {
          // a G1 scene: the commit carries the child's pick / order; its expression is the key
          const sc = bound.params?.scene, pr = sc?.probe;
          const key = pr?.correct?.match(/^pick == '([a-z0-9_]+)'$/)?.[1];
          const ch = (sc?.nodes ?? []).find((n) => n.kind === "choice");
          const ord = pr?.correct?.match(/^order\((\w+)\) == '([^']+)'$/);
          const mk = (vars, order) => ({ kind: "sc.commit", probe: pr?.id, probe_kind: pr?.kind, via: "tap", vars, ...(order ? { order } : {}) });
          if (key && ch) {
            const wrongId = ch.options?.map((o) => o.id).find((o) => o !== key);
            steps = shuffle([...(wrongId ? [{ label: "honest wrong", data: mk({ [ch.var ?? "pick"]: wrongId }), claim: false, truth: "wrong" },
              { label: "forged: wrong pick, claim correct:true", data: mk({ [ch.var ?? "pick"]: wrongId }), claim: true, truth: "wrong" }] : [])]);
            steps.push({ label: "forged: right pick, claim correct:false", data: mk({ [ch.var ?? "pick"]: key }), claim: false, truth: "correct" });
          } else if (ord) {
            const right = ord[2].split(","), wrong = [...right].reverse();
            steps = wrong.join() !== right.join() ? [{ label: "forged: wrong order, claim correct:true", data: mk({}, { [ord[1]]: wrong }), claim: true, truth: "wrong" }] : [];
            steps.push({ label: "forged: right order, claim correct:false", data: mk({}, { [ord[1]]: right }), claim: false, truth: "correct" });
          } else steps = [];
        } else {
          const keyV = bound.params?.target ?? bound.params?.value ?? bound.params?.n ?? item.answer;
          const wrongV = wrongValueOf(keyV);
          steps = shuffle([{ label: "honest wrong", data: { value: wrongV }, claim: false, truth: "wrong" }, { label: "forged: wrong value, claim correct:true", data: { value: wrongV }, claim: true, truth: "wrong" }]);
          steps.push({ label: "forged: right value, claim correct:false", data: { value: String(keyV) }, claim: false, truth: "correct" });
        }
        for (const s of steps) {
          if (L.ended || L.last?.ui?.ask?.itemId !== item.id) break;
          const ev = { moduleEvents: [{ moduleId: bound.moduleId, engine: bound.engine, type: "answer", name: "answer", data: { value: s.data, correct: s.claim }, at: Date.now() }] };
          const row = await L.turn("", { kind: "module", raw: true, body: { ...ev, asrConfidence: undefined } });
          track(row.r);
          const v = row.r?.ui?.verdict ?? null;
          const wrongGrade = row.r?.error ? null : s.truth === "correct" ? v !== "correct" : v === "correct";
          moduleRows.push({ topicId, engine: bound.engine, itemId: item.id, key: item.answer, step: s.label, value: JSON.stringify(s.data).slice(0, 120), claim: s.claim, truth: s.truth, verdict: v, wrongGrade, reply: row.r?.teacherReply, error: row.r?.error ?? null });
          if (v === "correct") break;
        }
        continue;
      }
      if (item) {
        const A = answersFor(item, kit, persona);
        const roll = rnd();
        const which = roll < 0.3 ? "correct" : roll < 0.55 ? "wrong" : roll < 0.75 ? "noisy" : A.partial ? "partial" : "wrong";
        const truth = which === "noisy" ? "correct" : which;
        const row = await L.turn(A[which], { kind: "answer" }); track(row.r);
        const v = row.r?.ui?.verdict ?? null;
        const reAsked = row.r?.ui?.ask?.itemId === item.id;
        const rep = String(row.r?.teacherReply ?? "");
        let wrongGrade = null;
        if (!row.r?.error) {
          if (truth === "correct") wrongGrade = v === "not_yet" || v === "partial" || (!v && reAsked);
          else wrongGrade = v === "correct";
        }
        const words = v === "not_yet" && (RX.praiseOpen.test(rep) || RX.praiseAny.test(rep)) ? "praise_on_not_yet"
          : v === "correct" && RX.denyAny.test(rep) ? "deny_on_correct" : !v && truth !== "correct" && RX.praiseAny.test(rep) ? "praise_ungraded" : null;
        gradeRows.push({ topicId, itemId: item.id, kind: item.kind, key: item.answer, gave: A[which], which, truth, verdict: v, reAsked, wrongGrade, words, reply: rep, lane: spoken ? "spoken" : "typed" });
        continue;
      }
      const row = await L.turn(pick(persona.lang === "english" ? ["okay", "yes", "go on"] : ["haan", "ok", "achha, aage"]), { kind: "filler" });
      track(row.r);
    }
    await L.end();
    transcripts.push({ topicId, ...compact(L) });
    console.log(`${topicId} (${spoken ? "spoken" : "typed"}): ${L.rows.length} turns; typed grades ${gradeRows.filter((g) => g.topicId === topicId).length}, module answers ${moduleRows.filter((g) => g.topicId === topicId).length}`);
  }
}, { tag: "owner1", child: { firstName: "Riya" } });

// ───────────────────────────── B. the frame ─────────────────────────────
const HARNESS = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0}iframe{display:block;width:100%;height:760px;border:0}</style></head><body><script>
window.events=[];let port=null,frame=null,listener=null;
window.mount=(engine,params,opts={})=>{window.events=[];port=null;if(frame)frame.remove();const moduleId=opts.moduleId||"ot1";
frame=document.createElement("iframe");frame.setAttribute("sandbox","allow-scripts");frame.src="/modules.html#"+moduleId;document.body.appendChild(frame);
const init={type:"init",moduleId,engine,params,goal:opts.goal,lang:opts.lang||"english",ageBand:opts.ageBand||"10-15"};
const onMsg=(e)=>{if(e.source!==frame.contentWindow||!e.data||e.data.type!=="ready"||port)return;const ch=new MessageChannel();port=ch.port1;port.onmessage=(m)=>window.events.push(m.data);frame.contentWindow.postMessage(init,"*",[ch.port2]);};
if(listener)window.removeEventListener("message",listener);listener=onMsg;window.addEventListener("message",onMsg);};
window.send=(m)=>port&&port.postMessage(m);</script></body></html>`;

/** The value an engine's answer committed (null when its kind carries none). */
function committedOf(v) {
  if (!v || typeof v !== "object") return null;
  const p = v.chosen ?? v.choice;
  if (p != null && Array.isArray(v.fractions)) return /^\d+$/.test(String(p)) && v.fractions[Number(p)] != null ? String(v.fractions[Number(p)]) : String(p);
  for (const k of ["value", "written", "built", "claimed", "made", "given", "product"]) if (v[k] != null && typeof v[k] !== "object") return String(v[k]);
  return null;
}
const sameValue = (a, b) => { const x = numOf(a), y = numOf(b); return x != null && y != null ? Math.abs(x - y) < 1e-9 : norm(a) === norm(b); };

const frameRecs = [];
if (browserOn()) {
  const plans = [];
  // every bindable engine: up to 2 bound plans (different topics first), as the catalog builds them
  for (const [engine] of Object.entries(engineTopics)) {
    const mine = shuffle(boundPlans.filter((b) => b.engine === engine));
    const seenT = new Set();
    for (const b of mine) { if (plans.filter((p) => p.engine === engine).length >= 2) break; if (seenT.has(b.topicId) && mine.length > 2) continue; seenT.add(b.topicId); plans.push({ source: "catalog", engine, topicId: b.topicId, params: b.plan.params, goal: b.plan.goal, key: b.plan.key ?? b.item.answer, kitKey: b.item.answer, itemId: b.item.id, lang: "english", classLevel: classOf(b.topicId) }); }
  }
  // the engines with no item binding (science explore engines): one unbound show each, for the unanswerable check
  for (const engine of Object.keys(ENGINES).filter((e) => !engineTopics[e] && e !== "explainer@1" && e !== "scene@1")) {
    const topicId = Object.entries(TOPIC_MAP).find(([, e]) => e === engine)?.[0];
    if (!topicId) continue;
    let kit; try { kit = kitOf(topicId); } catch { continue; }
    const plan = planEngine({ kit, item: kit.items.find((x) => ITEM_KINDS.has(x.kind)) ?? null, lang: "english", mode: "show", topicMap: TOPIC_MAP });
    if (plan) plans.push({ source: "catalog-unbound", engine: plan.engine, topicId, params: plan.params, goal: undefined, key: null, kitKey: null, itemId: null, lang: "english", classLevel: classOf(topicId) });
  }
  // every distinct mount the Director sent in A (bound or not): the activities children actually saw
  const seenSig = new Set();
  for (const m of directorMounts) {
    if (m.engine === "explainer@1") continue;
    const sig = `${m.engine}|${JSON.stringify(m.params).slice(0, 300)}`;
    if (seenSig.has(sig)) continue; seenSig.add(sig);
    const itemId = m.params?.itemId ?? (String(m.goal ?? "").startsWith("item:") ? m.goal.slice(5) : String(m.goal ?? "").startsWith("g1:") ? m.goal.slice(3) : null);
    let kitKey = null; try { kitKey = itemOf(kitOf(m.topicId), itemId)?.answer ?? null; } catch { /* none */ }
    plans.push({ source: "director", engine: m.engine, topicId: m.topicId, params: m.params, goal: m.goal, key: m.params?.target ?? kitKey, kitKey, itemId, lang: m.lang, classLevel: m.classLevel, moduleId: m.moduleId });
  }
  let b = null;
  try {
    b = await launchRouted({ viewport: { width: 400, height: 800 }, pages: { "/__owner_harness.html": HARNESS } });
    const { page } = b;
    await page.goto(`${new URL(BASE).origin}/__owner_harness.html`);
    for (const p of plans) {
      const rec = { source: p.source, engine: p.engine, topicId: p.topicId, itemId: p.itemId, key: p.key, kitKey: p.kitKey, bound: !!p.itemId && p.source !== "catalog-unbound", commits: [], issues: [] };
      try {
        await page.evaluate(([e, prm, o]) => window.mount(e, prm, o), [p.engine, p.params, { lang: p.lang, ageBand: p.classLevel <= 4 ? "6-9" : "10-15", goal: p.goal, moduleId: p.moduleId ?? "own1" }]);
        const frame = await (await page.waitForSelector("iframe", { timeout: 15_000 })).contentFrame();
        const mountedUi = await frame.waitForSelector(".ek[data-engine], .sc, [data-scene], button", { timeout: 20_000 }).then(() => true, () => false);
        if (!mountedUi) { rec.issues.push("unanswerable: the frame showed no engine UI within 20 s"); frameRecs.push(rec); continue; }
        rec.text = (await frame.locator("body").innerText().catch(() => "")).replace(/\s+/g, " ").slice(0, 160);
        const answersN = async () => (await page.evaluate(() => window.events)).filter((e) => e.type === "answer").length;
        const visible = async (sel) => { const out = []; for (const c of await frame.$$(sel)) if (await c.isVisible().catch(() => false)) out.push(c); return out; };
        const clickCheck = async () => { const c = frame.locator('[data-target="check"]').first(); if (await c.isVisible().catch(() => false)) { await c.click({ timeout: 2000 }).catch(() => {}); return true; } return false; };
        const record = async (label, before) => {
          await page.waitForTimeout(400);
          const answers = (await page.evaluate(() => window.events)).filter((e) => e.type === "answer");
          if (answers.length <= before) return null;
          const a = answers.at(-1);
          const val = committedOf(a.value);
          let truth = null, how = null;
          if (p.engine === "scene@1" && a.value?.kind === "sc.commit") {
            const pr = p.params?.scene?.probe;
            const keyId = pr?.correct?.match(/^pick == '([a-z0-9_]+)'$/)?.[1];
            const ord = pr?.correct?.match(/^order\((\w+)\) == '([^']+)'$/);
            if (keyId) { truth = Object.values(a.value.vars ?? {}).includes(keyId); how = "scene key"; }
            else if (ord) { truth = (a.value.order?.[ord[1]] ?? []).join(",") === ord[2]; how = "scene order"; }
          }
          if (truth == null && Array.isArray(a.value?.fractions) && ["bigger", "smaller"].includes(a.value?.question) && (a.value.chosen ?? a.value.choice) != null) {
            const nums = a.value.fractions.map(numOf);
            const pk = a.value.chosen ?? a.value.choice;
            const allEq = nums.every((x) => Math.abs(x - nums[0]) < 1e-9);
            truth = String(pk) === "same" ? allEq : !allEq && nums[Number(pk)] != null && nums.every((x) => (a.value.question === "bigger" ? nums[Number(pk)] >= x - 1e-9 : nums[Number(pk)] <= x + 1e-9));
            how = "compare from first principles";
          }
          if (truth == null && val != null && p.key != null && numOf(p.key) != null && /^\s*[-\d]/.test(String(p.key))) { truth = sameValue(val, p.key); how = "value vs plan key"; }
          const c = { label, claim: typeof a.correct === "boolean" ? a.correct : null, committed: val, kind: a.value?.kind ?? null, truth, how, misgrade: truth != null && typeof a.correct === "boolean" && truth !== a.correct };
          rec.commits.push(c);
          if (c.misgrade) rec.issues.push(`misgrade: ${label}: the frame said correct:${a.correct} for ${JSON.stringify(a.value).slice(0, 120)} (${how}: ${truth}; key ${p.key})`);
          if (a.correct) { await page.evaluate(() => window.send({ type: "reset" })); await page.waitForTimeout(300); }
          return c;
        };
        const pad = await visible(".ek-pad-key");
        const arrows = await visible('[data-target="right"]');
        if (pad.length) {
          const keyStr = String(p.key ?? "");
          const typeIn = async (str) => {
            for (let k = 0; k < 10; k++) await frame.locator('.ek-pad-key[data-key="⌫"]').first().click({ timeout: 1500 }).catch(() => {});
            for (const ch of str) await frame.locator(`.ek-pad-key[data-key="${ch === "-" ? "−" : ch}"]`).first().click({ timeout: 1500 }).catch(() => {});
          };
          const f = keyStr.match(FRAC);
          const wrong = f ? `${f[1]}/${Number(f[2]) + 1}` : String((numOf(keyStr) ?? 0) + 1);
          const equiv = f ? `${Number(f[1]) * 2}/${Number(f[2]) * 2}` : null;
          for (const [label, str] of shuffle([["keypad: the key", keyStr], ["keypad: a wrong value", wrong], ...(equiv ? [["keypad: an equivalent fraction", equiv]] : [])])) {
            if (!str) continue;
            const before = await answersN();
            await typeIn(str.replace(/,/g, ""));
            await clickCheck();
            await record(`${label} "${str}"`, before);
          }
        } else if (arrows.length) {
          for (let k = 0; k < 14; k++) await frame.locator('[data-target="left"]').first().click({ timeout: 1000 }).catch(() => {});
          for (let k = 0; k < 9; k++) {
            const before = await answersN();
            await clickCheck();
            const c = await record(`stepper: position ${k}`, before);
            const steps = c?.claim ? k + 1 : 1;
            for (let j = 0; j < steps; j++) await frame.locator('[data-target="right"]').first().click({ timeout: 1000 }).catch(() => {});
          }
        } else {
          const opts = await visible("button:not([data-target=check])");
          for (let k = 0; k < Math.min(opts.length, 6); k++) {
            const now = await visible("button:not([data-target=check])");
            if (!now[k]) break;
            const before = await answersN();
            await now[k].click({ timeout: 2000 }).catch(() => {});
            await clickCheck();
            await record(`option ${k}`, before);
          }
        }
        for (let k = 0; k < 5; k++) {   // seeded random taps on whatever the engine shows
          const before = await answersN();
          const taps = Math.floor(rnd() * 6);
          for (let t = 0; t < taps; t++) {
            const vis = await visible('[data-target]:not([data-target="check"]), [data-step], [data-big], .ek-pad-key, .ek button, .sc button');
            if (!vis.length) break;
            await pick(vis).click({ timeout: 2000 }).catch(() => {});
          }
          await clickCheck();
          await record(`random: ${taps} taps`, before);
        }
        const hasCheck = (await visible('[data-target="check"]')).length > 0;
        const commits = rec.commits.filter((c) => c.claim != null).length;
        if (!commits && (rec.bound || hasCheck)) rec.issues.push(`unanswerable: ${rec.bound ? "an item-bound activity" : "a Check is on screen"} but no tap sequence committed an answer (frame showed "${rec.text}")`);
        if (rec.bound && commits && !rec.commits.some((c) => c.truth != null)) rec.unverifiable = true;
      } catch (e) { rec.issues.push(`harness: ${String(e.message).slice(0, 160)}`); }
      frameRecs.push(rec);
      console.log(`frame ${p.source} ${p.engine} ${p.topicId} item ${p.itemId ?? "-"}: ${rec.commits.length} commits, ${rec.issues.length} issues`);
    }
  } catch (e) {
    ok(false, `frame phase could not run: ${String(e.message).slice(0, 160)}`);
  } finally { await b?.browser.close().catch(() => {}); }
} else warn("frame phase skipped (no Chromium / --no-browser): the frame's own grading is not checked in this run");

// ───────────────────────────── verdicts ─────────────────────────────
const path = save("owner-1.json", { base: BASE, seed: SEED, topics: TOPICS, gradeRows, moduleRows, frameRecs, directorMounts, transcripts });
const typedBad = gradeRows.filter((g) => g.wrongGrade);
const wordsBad = gradeRows.filter((g) => g.words);
const moduleBad = moduleRows.filter((g) => g.wrongGrade);
const frameMis = frameRecs.flatMap((r) => r.issues.filter((x) => x.startsWith("misgrade")).map((x) => `${r.engine} ${r.topicId}: ${x}`));
const unanswerable = frameRecs.flatMap((r) => r.issues.filter((x) => x.startsWith("unanswerable")).map((x) => `${r.source} ${r.engine} ${r.topicId} item ${r.itemId ?? "-"}: ${x}`));
const boundEngines = [...new Set(frameRecs.filter((r) => r.source === "catalog").map((r) => r.engine))];
const unverifiedEngines = boundEngines.filter((e) => !frameRecs.some((r) => r.engine === e && r.source === "catalog" && r.commits.some((c) => c.truth != null)));
console.log(`\ntyped answers ${gradeRows.length} (wrong grades ${typedBad.length}, words vs verdict ${wordsBad.length}); module answers ${moduleRows.length} (wrong grades ${moduleBad.length}); frame mounts ${frameRecs.length} (misgrades ${frameMis.length}, unanswerable ${unanswerable.length})  → ${path}`);
for (const g of typedBad.slice(0, 20)) console.log(`  TYPED ${g.topicId} ${g.itemId} [${g.which}] "${g.gave}" (key "${String(g.key).slice(0, 50)}") → verdict ${g.verdict ?? "none"}${g.reAsked ? ", re-asked" : ""}`);
for (const g of wordsBad.slice(0, 10)) console.log(`  WORDS ${g.topicId} ${g.itemId} verdict ${g.verdict}: ${g.words}: "${g.reply.slice(0, 100)}"`);
for (const g of moduleBad.slice(0, 20)) console.log(`  MODULE ${g.topicId} ${g.engine} ${g.itemId} [${g.step}] value ${g.value} (key ${g.key}) → verdict ${g.verdict ?? "none"}`);
for (const x of [...frameMis, ...unanswerable].slice(0, 20)) console.log(`  FRAME ${x}`);
ok(gradeRows.length >= TOPICS.length, `typed answers on kit items were graded (${gradeRows.length} over ${TOPICS.length} lessons)`);
ok(typedBad.length === 0, `typed answers: 0 wrong grades against the verified key — ${typedBad.length}/${gradeRows.length} (${tally(typedBad.map((g) => ({ code: `${g.which}→${g.verdict ?? (g.reAsked ? "re-asked" : "none")}` })))})`);
ok(wordsBad.length === 0, `the teacher's words agree with the verdict — ${wordsBad.length} disagree (${tally(wordsBad.map((g) => ({ code: g.words })))})`);
if (!moduleRows.length) warn("no item-bound activity was mounted on a posed item in these lessons: the server re-check (F1) was not exercised by the API phase");
ok(moduleBad.length === 0, `module answers: the server follows the VALUE against the key, never the frame's claim — ${moduleBad.length}/${moduleRows.length} wrong (${tally(moduleBad.map((g) => ({ code: g.step })))})`);
if (browserOn()) {
  ok(frameMis.length === 0, `the frame's own grading: 0 misgrades over ${frameRecs.reduce((a, r) => a + r.commits.filter((c) => c.truth != null).length, 0)} verifiable commits`);
  ok(unanswerable.length === 0, `no unanswerable activity (a Check no tap can commit; F4): ${unanswerable.length}`);
  ok(unverifiedEngines.length === 0, `every bindable engine yielded a verifiable commit (${boundEngines.length - unverifiedEngines.length}/${boundEngines.length}${unverifiedEngines.length ? `; not verified: ${unverifiedEngines.join(", ")}` : ""})`);
}
done();
