// Live Studio probe: the three build kinds. Each kind = a child-free brief + host-held truth (params, strings
// table, grader) + a scripted QA that plays the built artifact with REAL pointer clicks and checks it against the
// truth in code. Nothing here asks a model whether the artifact is right (rj-holistic-model-judge-gate).

/** Shared contract every build gets (structure, not lines: the law against recitation applies to code briefs too). */
export const STUDIO_API = `
RUNTIME (already loaded before your code; the only API you may use besides the DOM):
  Studio.params            host truth for this build (JSON; read-only). Never hard-code any value from it.
  Studio.t(key)            child-visible words, ONLY via this (keys listed in the brief). No other words anywhere.
  Studio.answer(value)     child's committed answer -> host grades it. You never decide right/wrong yourself.
  Studio.onVerdict(cb)     cb({correct}) after the host grades; show feedback from this; advance only on correct.
  Studio.event(name, data) interaction telemetry (small JSON).
  Studio.ready()           call once when the first screen is interactive.
  Studio.done()            call once when the activity is complete.
OUTPUT: one HTML body fragment, emitted in this ORDER so it paints while streaming:
  1) <style> (all CSS)  2) the complete static markup of the first screen (inline SVG for pictures)  3) ONE <script> at the end.
  No <html>/<head>/<body> tags, no markdown fences, no comments outside the code, no explanations.
SANDBOX: no network of any kind (no CDN, fonts, images by URL, fetch, XHR, WebSocket), no eval/Function, no
  localStorage, no alert/confirm, no external libraries. Inline SVG/CSS/JS only. Must work at 360x640 portrait with no
  horizontal scroll; every tappable thing >= 44x44 CSS px; nothing tappable outside the viewport.
QUALITY BAR: this is shown to a child by a warm human teacher who is talking while it appears. It must look crafted:
  a coherent palette, rounded friendly shapes, smooth CSS/SVG transitions, satisfying tap feedback (scale/pulse),
  gentle motion. No points, coins, scores, streaks or timers.`;

const fracGcd = (a, b) => (b ? fracGcd(b, a % b) : a);

export const KINDS = {
  fraction_game: {
    title: "fraction game (class 4, shade the fraction)",
    params: { items: [{ id: "i1", n: 3, d: 4 }, { id: "i2", n: 2, d: 5 }, { id: "i3", n: 5, d: 8 }], picture: "pizza-or-bar" },
    strings: { title: "Pizza Party", instr: "Itne hisse rang do:", check: "Check karo", right: "Shabaash! Bilkul sahi.",
      wrong: "Dhyan se gino, phir try karo.", done: "Saari pizza taiyaar!", hint: "Ek hissa tap karo, rang lag jayega." },
    brief: `KIND: game. Topic: fractions as parts of a whole (class 4). Language Hinglish.
ACTIVITY: for each item in Studio.params.items (in order) show a whole divided into item.d EQUAL parts (a pizza with
  equal slices or a bar with equal segments) and the target fraction item.n/item.d written as numerals. The child taps
  parts to toggle their colour (tap again to un-colour), then presses check -> Studio.answer({n: <coloured count>, d: item.d}).
  On verdict correct: celebrate briefly, then the next item. On wrong: gentle feedback, child can fix and check again.
  After the last item: done screen + Studio.done().
STRINGS keys: title, instr, check, right, wrong, done, hint.
TEST SEAM (required, exact): every part element has data-part="<index>" and data-shaded="true|false" kept current;
  the check control has data-action="check"; the container of the current item has data-item="<item.id>".
  All parts start un-coloured.`,
    makeGrader(params) { let i = 0; return (v) => { const it = params.items[i]; const ok = !!v && v.d === it.d && v.n === it.n; if (ok) i++; return ok; }; },
  },

  photosynthesis_anim: {
    title: "photosynthesis animation (class 7 science)",
    params: { steps: 5, flows: { water: "roots->leaf (up the stem)", co2: "air->leaf (into the leaf)", o2: "leaf->air (out of the leaf)", glucose: "made in the leaf" } },
    strings: { title: "Paudha khana kaise banata hai", sun: "Sooraj ki roshni", leaf: "Patti", roots: "Jadein", water: "Paani",
      co2: "Carbon dioxide", o2: "Oxygen", glucose: "Glucose (khana)", play: "Chalao", pause: "Roko",
      step1: "Sooraj ki roshni patti par padti hai.", step2: "Jadein paani upar bhejti hain.", step3: "Patti hawa se carbon dioxide leti hai.",
      step4: "Patti mein glucose banta hai.", step5: "Patti oxygen bahar chhodti hai.",
      ask: "Patti kaunsi gas bahar chhodti hai?" },
    brief: `KIND: animated explorable explanation. Topic: photosynthesis (class 7). Language Hinglish.
SCENE (inline SVG): sun (top), a plant with a leaf and roots in soil. Animated particles that keep flowing while playing:
  water particles move UP from the roots through the stem into the leaf; carbon dioxide particles move from the air INTO the leaf;
  oxygen particles move OUT of the leaf into the air; glucose appears/glows inside the leaf. Light rays from the sun to the leaf.
LABELS: sun, leaf, roots, water, co2, o2, glucose as visible SVG/HTML text (no overlapping labels, all inside the view).
CONTROLS: play/pause toggle (label play/pause), and 5 step buttons (numerals 1-5). A step button shows that step's caption
  (strings step1..step5) and emphasises that process. Captions are visible text. It starts PLAYING on step 1.
CHECK: after the steps, a question (ask) with three option buttons labelled with strings co2, o2, water ->
  Studio.answer("<key>"); show feedback from Studio.onVerdict; on correct call Studio.done().
STRINGS keys: title, sun, leaf, roots, water, co2, o2, glucose, play, pause, step1..step5, ask.
TEST SEAM (required, exact): particles carry data-flow="water|co2|o2" (one element per particle, SVG circle preferred,
  at least 3 per flow, moved by changing cx/cy or transform); the leaf element has data-entity="leaf", roots data-entity="roots";
  the play/pause control data-action="play"; step buttons data-action="step-1".."step-5"; the caption element data-caption;
  option buttons data-option="co2|o2|water". Labels are text elements with data-label="<key>".` + (process.env.STUDIO_BRIEF_V2 ? `
CLARIFICATIONS (v2): the question (ask) and its three option buttons are visible from the first screen, below the
  controls, inside 360x640 with the whole scene. After a wrong answer the options stay tappable and the child can answer
  again at once. Every label stays fully inside the 360 px width (wrap or shorten the layout, never clip). The data-entity
  attribute goes on the drawn shape itself (or a group that contains drawn shapes), never on an empty group.` : ""),
    makeGrader() { return (v) => v === "o2"; },
  },

  bar_chart_viz: {
    title: "bar-chart visualisation (class 5 data handling)",
    params: { data: [{ key: "mango", value: 12 }, { key: "banana", value: 7 }, { key: "apple", value: 9 }, { key: "guava", value: 4 }, { key: "orange", value: 6 }] },
    strings: { title: "Class 5 ke favourite phal", mango: "Aam", banana: "Kela", apple: "Seb", guava: "Amrood", orange: "Santra",
      yaxis: "Bachche", ask: "Sabse zyada bachchon ko kaunsa phal pasand hai? Us bar ko tap karo.", right: "Bilkul sahi!", wrong: "Bars ki lambai dobara dekho.", done: "Shabaash!" },
    brief: `KIND: data visualisation. Topic: reading a bar chart (class 5). Language Hinglish.
CHART: vertical bar chart of Studio.params.data (value = number of children). Bars grow in with an animation on first paint.
  A y-axis with numeric ticks and horizontal gridlines at a sensible step, axis title (yaxis), fruit names under bars.
  Bar heights MUST be exactly proportional to value on the same scale as the ticks (baseline 0). Tapping a bar shows its value.
QUESTION: show ask; the child taps a bar -> Studio.answer("<fruit key>"); feedback from Studio.onVerdict (right/wrong);
  on correct Studio.done() and done text. Bars must look identical before the child answers (no hint of the answer).
STRINGS keys: title, mango, banana, apple, guava, orange, yaxis, ask, right, wrong, done.
TEST SEAM (required, exact): each bar element (rect or div, the full-height drawn bar) has data-bar="<key>" and
  data-value="<value>"; each tick label has data-tick="<number>" and sits at that value's height; the chart's zero baseline
  is the bottom of every bar.`,
    makeGrader(params) { const top = params.data.reduce((a, b) => (b.value > a.value ? b : a)).key; return (v) => v === top; },
  },
};

/** The trusted runtime injected before agent code (the probe's stand-in for the frame kit). */
export function runtimeScript(kindId) {
  const k = KINDS[kindId];
  return `(function(){
  var P=${JSON.stringify(k.params)}, S=${JSON.stringify(k.strings)};
  var grade=(${k.makeGrader.toString().replace(/^makeGrader/, "function")})(P);
  var log=[], cbs=[]; window.__host={log:log, ready:false, done:false};
  function deep(o){Object.freeze(o);Object.keys(o).forEach(function(k){if(o[k]&&typeof o[k]==='object')deep(o[k]);});return o;}
  var Studio={ params:deep(JSON.parse(JSON.stringify(P))), lang:'hinglish',
    t:function(k){ if(!Object.prototype.hasOwnProperty.call(S,k)){ log.push({type:'bad_key',key:String(k)}); return ''; } return S[k]; },
    answer:function(v){ var c; try{ c=grade(JSON.parse(JSON.stringify(v))); }catch(e){ c=false; }
      log.push({type:'answer',value:v,correct:c,at:performance.now()});
      setTimeout(function(){ cbs.forEach(function(cb){ try{ cb({correct:c}); }catch(e){ log.push({type:'cb_threw',message:String(e)}); } }); }, 40); },
    onVerdict:function(cb){ if(typeof cb==='function') cbs.push(cb); },
    event:function(n,d){ log.push({type:'event',name:String(n)}); },
    ready:function(){ if(!window.__host.ready){ window.__host.ready=true; log.push({type:'ready',at:performance.now()}); } },
    done:function(){ window.__host.done=true; log.push({type:'done',at:performance.now()}); } };
  Object.freeze(Studio); Object.defineProperty(window,'Studio',{value:Studio,writable:false,configurable:false});
})();`;
}

export const CSP = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src 'none'; connect-src 'none'; media-src 'none'; frame-src 'none'; worker-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'";

export function wrap(kindId, fragment) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${CSP}">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1"><script>${runtimeScript(kindId)}</script></head><body>${fragment}</body></html>`;
}

export function userPrompt(kindId) {
  const k = KINDS[kindId];
  return `${k.brief}\n\nStudio.params = ${JSON.stringify(k.params)}\nStrings table keys: ${Object.keys(k.strings).join(", ")}\n(Values are supplied at runtime by Studio.t; do not type them yourself.)\n\nReturn the fragment now.`;
}

export const SYSTEM = `You build one self-contained interactive learning artifact for an Indian child, rendered live in a sandboxed iframe while their teacher talks.
${STUDIO_API}
RULES (binding, last): words only via Studio.t; numbers only from Studio.params (or tick values you compute from them); never grade; keep every test-seam attribute exact; output only the fragment.`;
