// The seeded-mutant suite (LIVE-STUDIO §11 test 1, BUILD-PLAN W2-F acceptance): for each probe kind (shade_fraction,
// bar_chart_read, hub_flows) ≥ 15 mutants of a hand golden, each a precise source edit that plants one defect the
// gate must catch (wrong part count, water flowing down, O₂ into the leaf, label overlap, a stray English word, a fetch
// call, a hard-coded Studio.answer, done never called, overflow at the design box ...). Bar: RECALL = 1.0 (every mutant
// fails at least one hard check) and FALSE ALARMS 0/6 on goldens (the 3 hand goldens + 3 model-built passed builds).
// Usage: node evals/live-studio/mutants.mjs [--kinds a,b] [--json out.json] [--goldens-dir evals/live-studio/out-router-pilot]
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { runGate } from "../../server/studio/qa/gate.js";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const G = JSON.parse(fs.readFileSync(path.join(HERE, "goldens/goldens.json"), "utf8"));
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };

/** A mutant: [id, what it plants, edits: [find, replace][] | (html) => html]. Every `find` must occur (checked). */
export const MUTANTS = {
  shade_fraction: [
    ["part_count", "d+1 parts drawn", [["for(var i=0;i<it.d;i++){", "for(var i=0;i<it.d+1;i++){"]]],
    ["pre_shaded", "the first part starts coloured", [['el.setAttribute("data-shaded","false");', 'el.setAttribute("data-shaded",i===0?"true":"false");if(i===0)shaded[0]=true;']]],
    ["unequal_parts", "wedges of unequal angle", [["var a0=2*Math.PI*i/it.d-Math.PI/2,a1=2*Math.PI*(i+1)/it.d-Math.PI/2;", "var a0=2*Math.PI*Math.pow(i/it.d,1.4)-Math.PI/2,a1=2*Math.PI*Math.pow((i+1)/it.d,1.4)-Math.PI/2;"]]],
    ["stray_english", "a word outside the strings table", [['<div class="msg" id="m"></div>', '<div class="msg" id="m"></div><p style="position:absolute;left:250px;top:250px;margin:0;font-size:12px">Tap slices</p>']]],
    ["fetch_call", "a network call", [["draw();Studio.ready();", "try{fetch('data.json')}catch(e){}draw();Studio.ready();"]]],
    ["hardcoded_answer", "Studio.answer with literal values", [["Studio.answer({n:n,d:items[k].d});", "Studio.answer({n:3,d:4});"]]],
    ["no_done", "done never called", [["Studio.done();", ""]]],
    ["overflow", "content wider than the design box", [['<div class="msg" id="m"></div>', '<div class="msg" id="m"></div><div style="position:absolute;left:300px;top:200px;width:120px;height:30px;background:#eee">7</div>']]],
    ["advance_on_wrong", "the next item after a wrong answer", [['  else m.textContent=Studio.t("wrong");\n});', '  else {m.textContent=Studio.t("wrong");k++;if(k<items.length)setTimeout(draw,300);}\n});']]],
    ["no_unshade", "a second tap does not un-colour", [["shaded[i]=!shaded[i];", "shaded[i]=true;"]]],
    ["answer_off_by_one", "the posted count is one too many", [["var n=shaded.filter(Boolean).length;", "var n=shaded.filter(Boolean).length+1;"]]],
    ["seam_dead", "data-shaded never updates", [['el.setAttribute("data-shaded",shaded[i]?"true":"false");', ""]]],
    ["tiny_targets", "parts drawn 40 px wide", [["svg.whole{position:absolute;left:8px;top:40px;width:230px;height:230px}", "svg.whole{position:absolute;left:8px;top:40px;width:60px;height:60px}"]]],
    ["unknown_key", "Studio.t with a key not in the table", [['document.getElementById("i").textContent=Studio.t("instr");', 'document.getElementById("i").textContent=Studio.t("instructions");']]],
    ["eval_call", "eval in the build", [["draw();Studio.ready();", "eval('1');draw();Studio.ready();"]]],
    ["url_image", "an image by URL", [['<h1 id="t"></h1>', '<h1 id="t"></h1><img src="https://example.com/p.png" alt="">']]],
    ["hardcoded_target", "the target fraction typed in, not from params", [['document.getElementById("tg").textContent=it.n+"/"+it.d;', 'document.getElementById("tg").textContent="3/4";']]],
    ["inline_handler", "an inline on*= handler (blocked by the CSP)", [['<button data-action="check" id="c"></button>', '<button data-action="check" id="c" onclick="void 0"></button>']]],
    ["runtime_error", "an uncaught error after boot", [["draw();Studio.ready();", "draw();Studio.ready();setTimeout(function(){undefinedThing.x=1},50);"]]],
  ],
  bar_chart_read: [
    ["bar_off_3px", "one bar 3 units too tall", [['var b=el("rect",{x:cx+cw*0.2,y:base-h,width:cw*0.6,height:h,', 'var hh=h+(i===1?3:0);var b=el("rect",{x:cx+cw*0.2,y:base-hh,width:cw*0.6,height:hh,']]],
    ["tick_wrong", "tick labels evenly spaced, not at their value", [["var t=el(\"text\",{x:x0-6,y:y+3.5,", "var t=el(\"text\",{x:x0-6,y:base-(v/step)*(H/(top/step+1))+3.5,"]]],
    ["not_proportional", "heights by square root", [["var h=d.value*sc;", "var h=Math.sqrt(d.value/top)*H;"]]],
    ["baseline", "bars on different baselines", [['var b=el("rect",{x:cx+cw*0.2,y:base-h,', 'var b=el("rect",{x:cx+cw*0.2,y:base-h-(i%2)*6,']]],
    ["hint_colour", "the tallest bar coloured differently", [['"class":"bar","data-bar":d.key,', '"class":"bar","data-bar":d.key,style:d.value===max?"fill:#e63946":"",']]],
    ["stray_english", "a word outside the strings table", [['<div class="msg" id="m"></div>', '<div class="msg" id="m"></div><p style="position:absolute;left:250px;top:28px;margin:0;font-size:10px">Fruits</p>']]],
    ["fetch_call", "a network call", [["Studio.ready();\n})();", "try{fetch('x')}catch(e){}Studio.ready();\n})();"]]],
    ["hardcoded_answer", "every column answers the same key", [["c.addEventListener(\"click\",function(){if(done)return;Studio.answer(d.key);});", "c.addEventListener(\"click\",function(){if(done)return;Studio.answer(\"mango\");});"]]],
    ["no_done", "done never called", [["Studio.done();", ""]]],
    ["overflow", "content wider than the design box", [['<div class="msg" id="m"></div>', '<div class="msg" id="m"></div><div style="position:absolute;left:340px;top:100px;width:60px;height:20px">9</div>']]],
    ["names_overlap", "every bar name drawn at one spot", [['var n=el("text",{x:cx+cw/2,y:base+16,', 'var n=el("text",{x:x0+20,y:base+16,']]],
    ["bar_only_target", "the column target only the bar's own height", [['var c=el("rect",{x:cx+2,y:base-H,width:cw-4,height:H+30,', 'var c=el("rect",{x:cx+cw*0.2,y:base-h,width:cw*0.6,height:h,']]],
    ["missing_bar", "the last bar not drawn", [["D.forEach(function(d,i){var cx=", "D.slice(0,-1).forEach(function(d,i){var cx="]]],
    ["wrong_value_attr", "data-value lies", [['"data-value":String(d.value)', '"data-value":String(d.value+1)']]],
    ["storage", "localStorage use", [["Studio.ready();\n})();", "try{localStorage.setItem('a','1')}catch(e){}Studio.ready();\n})();"]]],
    ["target_outside", "a column partly outside the box", [['var c=el("rect",{x:cx+2,y:base-H,width:cw-4,height:H+30,', 'var c=el("rect",{x:cx+2,y:base-H,width:cw-4,height:H+80,']]],
  ],
  hub_flows: [
    ["water_down", "water flowing down from the leaf", [["var paths={water:[[201,168],[201,92]],", "var paths={water:[[201,92],[201,168]],"]]],
    ["o2_into_leaf", "oxygen moving into the leaf", [["o2:[[226,80],[300,92]]};", "o2:[[300,92],[226,80]]};"]]],
    ["co2_out", "carbon dioxide moving out of the leaf", [["co2:[[100,80],[170,72]],", "co2:[[170,72],[100,80]],"]]],
    ["o2_by_sun", "the oxygen label by the sun", [['<text class="lab" data-label="o2" x="276" y="104"></text>', '<text class="lab" data-label="o2" x="20" y="70"></text>']]],
    ["label_overlap", "two labels on top of each other", [['<text class="lab" data-label="roots" x="222" y="168"></text>', '<text class="lab" data-label="roots" x="214" y="132"></text>']]],
    ["stray_english", "a word outside the strings table", [['<div class="cap" data-caption id="cap"></div>', '<div class="cap" data-caption id="cap"></div><p style="position:absolute;left:250px;top:2px;margin:0;font-size:10px">Science</p>']]],
    ["fetch_call", "a network call", [["Studio.ready();\n})();", "try{fetch('x')}catch(e){}Studio.ready();\n})();"]]],
    ["hardcoded_answer", "every option answers o2", [["b.addEventListener(\"click\",function(){if(!done)Studio.answer(k);});", "b.addEventListener(\"click\",function(){if(!done)Studio.answer(\"o2\");});"]]],
    ["no_done", "done never called", [["Studio.done();", ""]]],
    ["overflow", "content taller than the design box", [['.opts{position:absolute;left:8px;top:256px;', '.opts{position:absolute;left:8px;top:290px;']]],
    ["pause_ignored", "pause does not freeze the particles", [["function frame(){if(playing){t+=0.008;}", "function frame(){t+=0.008;"]]],
    ["caption_stuck", "next does not change the caption", [['cap.textContent=Studio.t("step"+step);});', "});"]]],
    ["few_particles", "two particles per flow", [["for(var k=0;k<4;k++){", "for(var k=0;k<2;k++){"]]],
    ["hint_option", "the right option styled differently", [['b.className="opt";b.setAttribute("data-option",k);', 'b.className="opt";if(k===P.options[1])b.style.background="#ffe066";b.setAttribute("data-option",k);']]],
    ["caption_not_table", "a caption typed in English", [['cap.textContent=Studio.t("step1");', 'cap.textContent="Plants make food";']]],
    ["missing_label", "the water label not drawn", [['<text class="lab" data-label="water" x="214" y="132"></text>', ""]]],
  ],
};

function mutate(html, edits) {
  if (typeof edits === "function") return edits(html);
  let out = html;
  for (const [find, rep] of edits) {
    if (!out.includes(find)) throw new Error(`mutant edit does not apply: ${find.slice(0, 60)}`);
    out = out.split(find).join(rep);
  }
  return out;
}

/** Run the suite. → { kinds: [{ kind, mutants: [{id, caught, failed}], goldens: [{name, pass}] }], recall, falseAlarms } */
export async function runSuite({ kinds = Object.keys(MUTANTS), goldensDir = path.join(HERE, "out-router-pilot"), browser } = {}) {
  const own = !browser;
  browser = browser ?? (await chromium.launch());
  const out = [];
  try {
    for (const kind of kinds) {
      const g = G[kind];
      const golden = fs.readFileSync(path.join(HERE, "goldens", `${kind}.html`), "utf8");
      const job = (fragment, which = "params") => ({ archetypeId: kind, fragment, params: g[which], strings: g[`${which}Strings`] ?? g.strings, band: g.band, perf: true });
      const mutants = [];
      for (const [id, what, edits] of MUTANTS[kind]) {
        const r = await runGate(browser, job(mutate(golden, edits)));
        mutants.push({ id, what, caught: !r.pass, failed: r.checks.filter((c) => !c.pass).map((c) => c.id) });
        console.log(`${kind} ${id}: ${r.pass ? "MISSED" : "caught"} (${r.checks.filter((c) => !c.pass).map((c) => c.id).slice(0, 4).join(", ")})`);
      }
      // goldens: the hand golden + model-built passed builds of this kind (bench winners), gated with the truth they won on
      const goldens = [{ name: `hand:${kind}`, html: golden, which: "params" }];
      if (fs.existsSync(goldensDir)) for (const f of fs.readdirSync(goldensDir).filter((n) => n.startsWith(`${kind}__race__`) && n.endsWith(".html") && !n.includes("__fail"))) {
        goldens.push({ name: `model:${f}`, html: fs.readFileSync(path.join(goldensDir, f), "utf8"), which: /__race__\d*[13579]\.html$/.test(f) && g.alt ? "alt" : "params" });
      }
      const gres = [];
      for (const gg of goldens.slice(0, 3)) {
        const r = await runGate(browser, job(gg.html, gg.which));
        gres.push({ name: gg.name, pass: r.pass, failed: r.checks.filter((c) => !c.pass).map((c) => c.id) });
        console.log(`${kind} golden ${gg.name}: ${r.pass ? "pass" : "FALSE ALARM " + r.checks.filter((c) => !c.pass).map((c) => c.id).join(",")}`);
      }
      out.push({ kind, mutants, goldens: gres });
    }
  } finally { if (own) await browser.close(); }
  const all = out.flatMap((k) => k.mutants), gs = out.flatMap((k) => k.goldens);
  return { kinds: out, recall: `${all.filter((m) => m.caught).length}/${all.length}`, falseAlarms: `${gs.filter((x) => !x.pass).length}/${gs.length}` };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const kinds = arg("kinds", Object.keys(MUTANTS).join(",")).split(",");
  const r = await runSuite({ kinds, goldensDir: path.resolve(arg("goldens-dir", path.join(HERE, "out-router-pilot"))) });
  console.log(`\nrecall ${r.recall}, false alarms ${r.falseAlarms}`);
  if (arg("json")) fs.writeFileSync(arg("json"), JSON.stringify(r, null, 1));
  const [k, n] = r.recall.split("/").map(Number), [fa] = r.falseAlarms.split("/").map(Number);
  process.exitCode = k === n && fa === 0 ? 0 : 1;
}
