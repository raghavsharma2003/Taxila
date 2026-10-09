/* ============================================================
   3 · LESSON — the pavilion at lamplight. Asha teaches; the board draws at the moment she refers to it;
   the child answers by voice or typing; the verdict comes from a verified key in code, never a model.
   ============================================================ */
const isPrime = (n) => { if (n < 2) return false; for (let d = 2; d * d <= n; d++) if (n % d === 0) return false; return true; };
const primeFactors = (n) => { const f = []; let m = n; for (let d = 2; d * d <= m; d++) while (m % d === 0) { f.push(d); m /= d; } if (m > 1) f.push(m); return f; };
const HI_NUM = { ek: 1, do: 2, teen: 3, tin: 3, chaar: 4, char: 4, paanch: 5, panch: 5, chhe: 6, che: 6, chhah: 6, cheh: 6, saat: 7, sat: 7, aath: 8, ath: 8, nau: 9, das: 10, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, "एक": 1, "दो": 2, "तीन": 3, "चार": 4, "पाँच": 5, "छह": 6, "सात": 7, "आठ": 8, "नौ": 9 };
function parseAnswer(raw) {
  let s = " " + String(raw).toLowerCase().replace(/[²]/g, "^2").replace(/[³]/g, "^3").replace(/[⁴]/g, "^4") + " ";
  s = s.replace(/[०-९]/g, (d) => "0123456789"["०१२३४५६७८९".indexOf(d)]);
  for (const [w, n] of Object.entries(HI_NUM)) s = s.replace(new RegExp(`(^|[^a-z\\u0900-\\u097F])${w}(?=$|[^a-z\\u0900-\\u097F])`, "g"), `$1 ${n} `);
  s = s.replace(/(\d+)\s*\^\s*(\d+)/g, (_, b, e) => Array(Math.min(8, +e)).fill(b).join(" "));
  return (s.match(/\d+/g) || []).map(Number).filter((n) => n > 0 && n < 100000);
}

Screens.lesson = {
  build() {
    const el = html(`<section class="screen" id="s-lesson" aria-label="Live lesson">
      <div class="ls-bg scene">${scenePavilion()}</div>
      <div class="ls">
        <div class="ls-hud">
          <button class="pause" id="lPause">${ICON.pause}<span>Pause</span></button>
          <div class="ttl"><b>Prime factorisation</b><div class="phases"><span data-p="warm">Warm-up</span><span data-p="learn" class="on">Learn</span><span data-p="try">Try</span><span data-p="wrap">Wrap</span></div></div>
        </div>
        <div class="ls-board"><div class="board">
          <div class="slate panel solid" style="--c:12px"></div><div class="ledge" aria-hidden="true"><i class="chalk"></i><i class="duster"></i></div>
          <div class="bh" aria-hidden="true"><span>Prime factorisation</span><span>Fri, 9 Oct</span></div><svg class="tree" viewBox="0 0 320 306" preserveAspectRatio="xMidYMin meet" aria-label="Asha's board"><g id="bEx"></g><g id="bMain"></g></svg>
        </div></div>
        <div class="ls-low">
          <div class="dlg panel solid">
            <div class="portrait">${jharokha()}</div>
            <div class="dl-in">
              <div class="nameplate"><b>Asha <span class="ai-tag">AI</span></b><span class="floor" id="lFloor"></span></div>
              <div class="cap" id="lCap" aria-live="polite"></div>
            </div>
          </div>
          <div class="qcard panel" id="lQ" hidden>
            <div class="qt"><div class="eyebrow lamp" id="lQk">Asha asked</div><b id="lQt"></b></div>
            <button class="iconbtn" id="lHear" aria-label="Hear the question again">${ICON.repeat}</button>
          </div>
          <div class="dock" id="lDock">
            <button class="mic" id="lMic" aria-label="Microphone"><span class="ring"></span>${ICON.mic}</button>
            <div class="mid">
              <div class="floor" id="lTurn"></div>
              <div class="hint" id="lHint"></div>
              <div class="typerow" id="lType"><input id="lIn" inputmode="text" autocomplete="off" placeholder="e.g. 2 × 3 × …" aria-label="Type your answer"><button class="btn lamp" id="lSend" aria-label="Send">${ICON.send}</button></div>
            </div>
            <button class="iconbtn" id="lKb" aria-label="Type instead" style="background:rgba(20,17,40,.66);box-shadow:inset 0 0 0 1px var(--hair-2)">${ICON.keyboard}</button>
          </div>
        </div>
      </div>
      <div class="placename"></div>
      <div class="pausesheet" id="lPauseSheet" hidden style="position:absolute;inset:0;z-index:40;background:rgba(10,8,20,.6);display:flex;align-items:flex-end;padding:12px">
        <div class="panel solid" style="width:100%;max-width:440px;margin:0 auto;padding:20px">
          <h3 class="h-2">Paused</h3><p class="body" style="margin:6px 0 16px">Asha waits. Nothing you did is lost.</p>
          <div style="display:grid;gap:10px"><button class="btn lamp block" id="lCont">Continue</button><button class="btn ghost block" id="lEnd">End the lesson</button></div>
        </div>
      </div>
    </section>`);
    $("#tx").appendChild(el);
    this.el = el;
    this.ex = $("#bEx", el); this.main = $("#bMain", el);
    $("#lMic", el).onclick = () => this.micTap();
    $("#lKb", el).onclick = () => { const t = $("#lType", el); t.classList.toggle("on"); if (t.classList.contains("on")) { $("#lIn", el).focus(); if (this.floor === "speaking") this.bargeIn(); } };
    $("#lSend", el).onclick = () => this.typed();
    $("#lIn", el).addEventListener("keydown", (e) => { if (e.key === "Enter") this.typed(); });
    $("#lHear", el).onclick = () => { if (this.floor === "your_turn" && this.ask) { const d = Face.say(this.ask); setTimeout(() => this.floor === "your_turn" && Face.setStatus("your_turn"), d); } };
    $("#lPause", el).onclick = () => { $("#lPauseSheet", el).hidden = false; this.paused = true; Face.cut(); Face.setStatus(null); };
    $("#lCont", el).onclick = () => { $("#lPauseSheet", el).hidden = true; this.paused = false; this.setFloor(this.floor === "speaking" ? "your_turn" : this.floor); };
    $("#lEnd", el).onclick = () => { $("#lPauseSheet", el).hidden = true; go("home", { back: true }); };
  },
  enter() {
    this.reset();
    requestAnimationFrame(() => Face.attach($(".portrait", this.el), matchMedia("(min-width: 900px)").matches && !$("#shell").classList.contains("phone") ? [70, 10, 884] : [170, 60, 690]));
    placeName(this.el, "Chapter 5 · Prime Time", "The Pavilion");
    this.run();
  },
  leave() { Face.cut(); Face.setStatus(null); clearInterval(this.lvl); },
  reset() {
    this.ex.innerHTML = ""; this.main.innerHTML = ""; this.ex.removeAttribute("transform");
    this.attempt = 0; this.prevFan = null; this.ask = ""; this.done = false; this.paused = false; this.asking = false; this.inFeedback = false; this.rid = (this.rid || 0) + 1;
    $("#lQ", this.el).hidden = true; $("#lCap", this.el).textContent = ""; $("#lType", this.el).classList.remove("on"); $("#lIn", this.el).value = "";
    $("#lMic", this.el).style.display = ""; $("#lKb", this.el).style.display = "";
    $$("#lDock .after", this.el).forEach((n) => n.remove());
    this.phase("learn"); this.setFloor("speaking", true);
  },
  phase(p) { $$(".phases span", this.el).forEach((s) => s.classList.toggle("on", s.dataset.p === p)); },
  setFloor(f, quiet) {
    this.floor = f;
    const mic = $("#lMic", this.el), turn = $("#lTurn", this.el), hint = $("#lHint", this.el), fl = $("#lFloor", this.el);
    mic.classList.remove("yt", "li", "th");
    clearTimeout(this.thT);
    if (f === "speaking") { fl.innerHTML = `<i>${FLOOR.speaking}</i>Talking`; turn.className = "floor"; turn.innerHTML = ""; hint.textContent = "Tap the mic to interrupt her"; mic.setAttribute("aria-label", "Interrupt Asha"); Face.setStatus("speaking"); }
    if (f === "your_turn") { fl.innerHTML = `<i>${FLOOR.your_turn}</i>Waiting`; mic.classList.add("yt"); turn.className = "floor yt"; turn.innerHTML = `<i>${FLOOR.your_turn}</i>Your turn`; hint.textContent = "Speak, or type your answer"; mic.setAttribute("aria-label", "Speak your answer"); Face.setStatus("your_turn");
      if (!quiet) { Sfx.turn(); try { navigator.vibrate && navigator.vibrate(20); } catch {} } }
    if (f === "listening") { fl.innerHTML = `<i>${FLOOR.listening}</i>Listening`; mic.classList.add("li"); turn.className = "floor li"; turn.innerHTML = `<i>${FLOOR.listening}</i>Listening…`; hint.textContent = "Prototype: plays a sample spoken answer"; mic.setAttribute("aria-label", "Done speaking"); Face.setStatus("listening"); }
    if (f === "thinking") { mic.classList.add("th"); turn.className = "floor"; fl.innerHTML = ""; Face.setStatus("thinking");
      this.thT = setTimeout(() => { if (this.floor === "thinking") fl.innerHTML = `<i>${FLOOR.thinking}</i>Thinking`; }, 600); }
  },
  async line(text, act) {
    const s = seq(), cap = $("#lCap", this.el);
    cap.textContent = text; cap.classList.remove("fade"); void cap.offsetWidth; cap.classList.add("fade");
    this.setFloor("speaking");
    const dur = Face.say(text);
    if (act) act(dur);
    this.speakEnd = performance.now() + dur;
    while (performance.now() < this.speakEnd) { if (!(await s.wait(50))) return false; while (this.paused) { if (!(await s.wait(100))) return false; } }
    return s.alive();
  },
  async run() {
    const s = seq();
    const rid = this.rid = (this.rid || 0) + 1;
    if (!(await s.wait(RM ? 200 : 900))) return;
    const steps = [
      ["Chalo — 12 ko uske primes tak todte hain.", () => this.drawEx(0)],
      ["12 = 3 × 4. 3 prime hai — woh aage nahi tootega.", (d) => { this.drawEx(1); setTimeout(() => this.drawEx(2), d * 0.55); }],
      ["Par 4 abhi bhi toot sakta hai: 4 = 2 × 2.", () => this.drawEx(3)],
      ["Toh 12 = 2 × 2 × 3. Sirf primes bache.", () => this.drawEx(4)],
    ];
    for (const [t, a] of steps) { if (rid !== this.rid) return; const ok = await this.line(t, a); if (!ok || rid !== this.rid) return; await sleep(220); }
    if (rid === this.rid) this.askNow();
  },
  bargeIn() {
    if (this.floor !== "speaking" || this.done) return;
    Face.cut(); this.speakEnd = 0;                 // she stops at once; the line ends here
    if (this.asking || this.inFeedback) return;    // the ask (or her reply) simply ends; the flow hands the turn over
    this.rid = (this.rid || 0) + 1; this.drawEx(4, true); this.askNow();
  },
  async askNow() {
    if (this.asking) return; this.asking = true;
    const s = seq(); this.phase("try");
    this.interrupted = false;
    this.ask = "Ab tumhari baari. 36 ke saare prime factors batao.";
    this.drawEx(5);
    $("#lQt", this.el).textContent = "36 ke saare prime factors batao."; $("#lQk", this.el).textContent = "Asha asked";
    const ok = await this.line(this.ask, () => { $("#lQ", this.el).hidden = false; $("#lQ", this.el).animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 320, easing: "cubic-bezier(.22,.8,.2,1)" }); });
    this.asking = false;
    if (!ok && !s.alive()) return;
    this.setFloor("your_turn");
  },
  micTap() {
    Sfx.ensure();
    if (this.done) return;
    if (this.floor === "speaking") return this.bargeIn();
    if (this.floor === "your_turn") return this.listen();
    if (this.floor === "listening") return this.commit(this.sample.final, "said");
  },
  listen() {
    const samples = [
      { parts: ["chhe…", "chhe guna…", "chhe guna chhe"], final: "6 × 6" },
      { parts: ["do…", "do guna do…", "do guna do guna teen…", "do guna do guna teen guna teen"], final: "2 × 2 × 3 × 3" },
    ];
    this.sample = samples[Math.min(this.attempt, 1)];
    this.setFloor("listening");
    const hint = $("#lHint", this.el), ring = $("#lMic .ring", this.el);
    let i = 0, t0 = performance.now();
    clearInterval(this.lvl);
    this.lvl = setInterval(() => {
      const t = (performance.now() - t0) / 1000, lv = Math.max(0, Math.sin(t * 9) * 0.5 + Math.sin(t * 23) * 0.3 + 0.4) * (t < 2.4 ? 1 : 0);
      ring.style.transform = `scale(${(1 + lv * 0.18).toFixed(3)})`;
      const k = Math.min(this.sample.parts.length - 1, Math.floor(t / 0.62));
      if (k !== i || t < 0.1) { i = k; hint.textContent = "“" + this.sample.parts[k] + "”"; }
      if (t > 2.9) { clearInterval(this.lvl); ring.style.transform = ""; if (this.floor === "listening") this.commit(this.sample.final, "said"); }
    }, 60);
  },
  typed() { const v = $("#lIn", this.el).value.trim(); if (!v) return; if (this.floor === "speaking") this.bargeIn(); $("#lIn", this.el).value = ""; $("#lType", this.el).classList.remove("on"); this.commit(v, "typed"); },
  async commit(text, how) {
    clearInterval(this.lvl); $("#lMic .ring", this.el).style.transform = "";
    const s = seq();
    this.attempt++;
    const nums = parseAnswer(text);
    const shown = nums.length ? nums.join(" × ") : text;
    $("#lHint", this.el).innerHTML = "";
    $("#lTurn", this.el).className = "floor"; $("#lTurn", this.el).innerHTML = `<span class="answer-chip">You ${how}: <b>${shown.replace(/</g, "&lt;")}</b><span class="mk" id="lMark"></span></span>`;
    try { navigator.vibrate && navigator.vibrate(12); } catch {}
    this.setFloor("thinking");
    this.drawChildAnswer(nums);                      // receipt: the child's own answer goes on the board at once
    if (!(await s.wait(1300))) return;               // identical wait for every answer: nothing leaks the verdict early
    const prod = nums.reduce((a, b) => a * b, 1);
    const comps = nums.filter((n) => n > 1 && !isPrime(n));
    let verdict, say;
    if (!nums.length) { verdict = "unheard"; say = "Mujhe numbers samajh nahi aaye. Jaise “do guna teen” bolo, ya likh do."; }
    else if (nums.includes(1)) { verdict = "look"; say = "1 se kuch nahi badalta — 1 prime nahi hai. Use hata ke dekho."; }
    else if (prod !== 36) { verdict = "look"; say = `Inka guna ${prod} aata hai, 36 nahi. Ek baar phir guna karke dekho.`; }
    else if (comps.length) { verdict = "look"; const c = [...new Set(comps)]; say = `${nums.join(" × ")} se 36 banta hai, yeh sahi hai. Par ${c.join(" aur ")} ko dekho — kya ${c.length > 1 ? "woh" : "woh"} aur toot sakta hai?`; }
    else { verdict = "right"; say = `Bilkul. ${nums.join(" × ")} — saare prime hain, aur inka guna wapas 36.`; }
    // verdict mark lands on the answer at her voice onset; right and wrong take the same time
    const mk = $("#lMark", this.el);
    if (mk) mk.innerHTML = verdict === "right" ? `<span style="color:var(--known)">${ICON.tick}</span>` : verdict === "look" ? `<span style="color:var(--look)">${ICON.look}</span>` : "";
    this.boardVerdict(verdict, nums);
    this.inFeedback = true;
    const ok = await this.line(say);
    this.inFeedback = false;
    if (!ok) return;
    if (verdict === "right") {
      this.done = true; this.phase("wrap");
      await sleep(250);
      this.inFeedback = true; const ok2 = await this.line("Ab bina madad ke: 72 ko khud todke dekho."); this.inFeedback = false; if (!ok2) return;
      Face.setStatus(null); $("#lFloor", this.el).innerHTML = "";
      $("#lMic", this.el).style.display = "none"; $("#lKb", this.el).style.display = "none"; $("#lQ", this.el).hidden = true;
      $("#lTurn", this.el).innerHTML = ""; $("#lHint", this.el).textContent = "";
      const row = html(`<div class="after" style="display:flex;gap:8px;width:100%"><button class="btn lamp" style="flex:1.4">${ICON.play}<span>Break 72</span></button><button class="btn ghost" style="flex:1">See your valley</button></div>`);
      $("#lDock", this.el).insertBefore(row, $("#lDock .mid", this.el));
      $("#lDock .mid", this.el).style.display = "none";
      row.children[0].onclick = () => go("game", { from: centerOf($(".board", this.el)) }); row.children[1].onclick = () => go("map");
      row.animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], { duration: 420, easing: "cubic-bezier(.22,.8,.2,1)" });
    } else {
      $("#lQk", this.el).textContent = "Let’s look again";
      this.setFloor("your_turn");
    }
  },

  /* ---------- the board: chalk-light drawn at the moment she refers to it ---------- */
  chalkLine(g, x1, y1, x2, y2, delay = 0, dur = 520) {
    const len = Math.hypot(x2 - x1, y2 - y1);
    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", `M${x1},${y1} L${x2},${y2}`); p.setAttribute("stroke", "#F4E7C9"); p.setAttribute("stroke-width", "2.2"); p.setAttribute("stroke-linecap", "round"); p.setAttribute("opacity", ".9");
    g.appendChild(p);
    if (!RM) p.animate([{ strokeDasharray: `${len}`, strokeDashoffset: `${len}` }, { strokeDasharray: `${len}`, strokeDashoffset: "0" }], { duration: dur, delay, easing: "cubic-bezier(.4,.1,.2,1)", fill: "both" });
    return p;
  },
  node(g, x, y, v, kind = "comp", delay = 0, big = false) {
    const s = big ? 1.25 : 1;
    const n = document.createElementNS("http://www.w3.org/2000/svg", "g");
    n.setAttribute("transform", `translate(${x} ${y})`); n.dataset.v = v;
    const shape = kind === "prime"
      ? `<circle r="${28 * s}" fill="#FFC24D" opacity=".16"/><path d="M${-9 * s},${-21 * s} L${9 * s},${-21 * s} L${21 * s},${-9 * s} L${21 * s},${9 * s} L${9 * s},${21 * s} L${-9 * s},${21 * s} L${-21 * s},${9 * s} L${-21 * s},${-9 * s} Z" fill="rgba(255,194,77,.12)" stroke="#FFD27A" stroke-width="2.2"/>`
      : `<rect x="${-22 * s}" y="${-19 * s}" width="${44 * s}" height="${38 * s}" rx="3" fill="rgba(244,231,201,.06)" stroke="#F4E7C9" stroke-width="2" opacity=".95"/>`;
    n.innerHTML = `<g class="nd">${shape}</g><text text-anchor="middle" dy="${8 * s}" font-family="Eczar, Georgia, serif" font-weight="700" font-size="${22 * s}" fill="${kind === "prime" ? "#FFE2A1" : "#F7EEDB"}">${v}</text>`;
    g.appendChild(n);
    if (!RM) n.animate([{ opacity: 0, transform: `translate(${x}px, ${y + 6}px) scale(.85)` }, { opacity: 1, transform: `translate(${x}px, ${y}px) scale(1)` }], { duration: 420, delay, easing: "cubic-bezier(.3,1.4,.5,1)", fill: "both" });
    return n;
  },
  primeUp(n) { // a composite outline becomes a prime medallion: the same shape language as the game
    const x = +n.getAttribute("transform").match(/translate\(([-\d.]+)/)[1], y = +n.getAttribute("transform").match(/ ([-\d.]+)\)/)[1];
    const g = n.parentNode, v = n.dataset.v; n.remove();
    const m = this.node(g, x, y, v, "prime");
    if (!RM) m.animate([{ filter: "brightness(2)" }, { filter: "brightness(1)" }], { duration: 700 });
    return m;
  },
  text(g, x, y, str, size = 20, fill = "#F7EEDB", delay = 0, anchor = "middle") {
    const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
    t.setAttribute("x", x); t.setAttribute("y", y); t.setAttribute("text-anchor", anchor); t.setAttribute("font-family", "Eczar, Georgia, serif"); t.setAttribute("font-weight", "700"); t.setAttribute("font-size", size); t.setAttribute("fill", fill);
    t.innerHTML = String(str).replace(/[×=≠]/g, (m) => `<tspan font-family="Mukta, sans-serif" font-weight="600">${m}</tspan>`); g.appendChild(t);
    if (!RM) t.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay, fill: "both" });
    return t;
  },
  drawEx(step, instant) {
    const g = this.ex;
    if (instant) { g.innerHTML = ""; for (let i = 0; i <= step; i++) this.drawEx(i); return; }
    if (step === 0) { g.innerHTML = ""; this.n12 = this.node(g, 160, 50, 12, "comp", 0, true); }
    if (step === 1) { this.chalkLine(g, 148, 74, 104, 116); this.chalkLine(g, 172, 74, 216, 116, 120); this.n3 = this.node(g, 96, 136, 3, "comp", 380); this.n4 = this.node(g, 224, 136, 4, "comp", 480); }
    if (step === 2 && this.n3 && this.n3.isConnected) this.primeUp(this.n3);
    if (step === 3) { this.chalkLine(g, 214, 158, 186, 196); this.chalkLine(g, 234, 158, 262, 196, 120); this.node(g, 180, 214, 2, "prime", 420); this.node(g, 268, 214, 2, "prime", 520); }
    if (step === 4) this.text(g, 160, 284, "12 = 2 × 2 × 3", 22, "#FFE2A1");
    if (step === 5) {
      const fade = RM ? Promise.resolve() : g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, fill: "forwards" }).finished.catch(() => {});
      fade.then(() => { g.getAnimations().forEach((a) => a.cancel()); g.innerHTML = "";
        this.text(g, 4, 17, "Example", 14, "#F4E7C9", 0, "start").setAttribute("opacity", ".6");
        this.text(g, 4, 39, "12 = 2 × 2 × 3", 17, "#FFE2A1", 80, "start");
        this.main.innerHTML = ""; this.n36 = this.node(this.main, 172, 54, 36, "comp", 0, true); });
    }
  },
  drawChildAnswer(nums) {
    const g = this.main;
    $$(".ans", g).forEach((n) => n.remove());
    const prod = nums.reduce((a, b) => a * b, 1);
    if (!nums.length) return;
    const correctNow = prod === 36 && nums.every(isPrime);
    const prev = this.prevFan;
    const grp = document.createElementNS("http://www.w3.org/2000/svg", "g"); grp.classList.add("ans"); g.appendChild(grp);
    if (correctNow && prev && prev.comps.length && prev.prod === 36) {
      // the child's own earlier tree grows: every composite on it breaks into its primes
      prev.kids.forEach(({ v, x, el }) => { if (isPrime(v)) return; const pf = primeFactors(v), w = 46;
        pf.forEach((p, i) => { const cx = x + (i - (pf.length - 1) / 2) * (pf.length > 2 ? 30 : w); this.chalkLine(grp, x, 156, cx, 194, i * 90); this.node(grp, cx, 214, p, "prime", 300 + i * 90); }); });
      this.pending = { y: 280 };
      return;
    }
    $$(".fan", g).forEach((n) => n.remove());
    const fan = document.createElementNS("http://www.w3.org/2000/svg", "g"); fan.classList.add("fan"); g.appendChild(fan);
    const n = nums.length, sp = n > 1 ? Math.min(110, 250 / (n - 1)) : 0, kids = [];
    nums.forEach((v, i) => { const x = 172 + (i - (n - 1) / 2) * sp; this.chalkLine(fan, 172, 80, x, 116, i * 70); kids.push({ v, x, el: this.node(fan, x, 136, v, "comp", 260 + i * 70) }); });
    this.prevFan = { kids, prod, comps: nums.filter((v) => v > 1 && !isPrime(v)) };
    this.pending = { y: 232 };
  },
  boardVerdict(verdict, nums) {
    const g = this.main, fan = $(".fan", g), y = (this.pending && this.pending.y) || 240;
    if (!nums.length) return;
    const prod = nums.reduce((a, b) => a * b, 1);
    if (verdict === "right") {
      $$("path[stroke-dasharray='1 6']", g).forEach((d) => d.remove());
      $$("g[data-v]", g).forEach((n) => { if (isPrime(+n.dataset.v) && !n.querySelector("circle")) this.primeUp(n); });
      const row = document.createElementNS("http://www.w3.org/2000/svg", "g"); row.classList.add("ans"); g.appendChild(row);
      this.text(row, 150, y, "36 = " + nums.slice().sort((a, b) => a - b).join(" × "), 22, "#FFE2A1");
      const tick = this.chalkLine(row, 262, y - 8, 272, y + 2, 300, 260); tick.setAttribute("stroke", "#FFD27A"); tick.setAttribute("stroke-width", "3.4");
      const tick2 = this.chalkLine(row, 272, y + 2, 292, y - 22, 540, 300); tick2.setAttribute("stroke", "#FFD27A"); tick2.setAttribute("stroke-width", "3.4");
      if (!RM) $$("g[data-v]", g).forEach((n, i) => n.animate([{ opacity: 1 }, { opacity: .55 }, { opacity: 1 }], { duration: 900, delay: i * 40 }));
    } else if (fan) {
      const row = document.createElementNS("http://www.w3.org/2000/svg", "g"); row.classList.add("ans"); g.appendChild(row);
      this.text(row, 160, y, nums.join(" × ") + " = " + prod + (prod === 36 ? "" : "  ≠ 36"), 20, prod === 36 ? "#F7EEDB" : "#9FD3F7");
      $$("g[data-v]", fan).forEach((n) => {
        const v = +n.dataset.v; if (v <= 1 || isPrime(v)) return;
        const crack = document.createElementNS("http://www.w3.org/2000/svg", "path");
        crack.setAttribute("d", "M-3,-18 L3,-7 L-3,1 L4,9 L-1,18"); crack.setAttribute("stroke", "#9FD3F7"); crack.setAttribute("stroke-width", "2"); crack.setAttribute("fill", "none"); crack.setAttribute("stroke-linecap", "round");
        n.appendChild(crack);
        if (!RM) crack.animate([{ strokeDasharray: "48", strokeDashoffset: "48" }, { strokeDasharray: "48", strokeDashoffset: "0" }], { duration: 600, fill: "both" });
        const dots = document.createElementNS("http://www.w3.org/2000/svg", "path");
        dots.setAttribute("d", "M-24,28 L24,28"); dots.setAttribute("stroke", "#9FD3F7"); dots.setAttribute("stroke-width", "2.2"); dots.setAttribute("stroke-dasharray", "1 6"); dots.setAttribute("stroke-linecap", "round"); n.appendChild(dots);
      });
    }
  },
};
