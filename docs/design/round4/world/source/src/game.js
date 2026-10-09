/* ============================================================
   4 · GAME — Todo-Jodo, mode atoms (round-3 family): the idea is the controller.
   The law runs (exact division), not a judge. Untimed, no lose state, free undo.
   Child-facing words come from the authored bank (data/play/reactions.json, todo-jodo, Hinglish).
   ============================================================ */
const BANK = {
  progress: ["{v} se {a} aur {b}.", "{a} aur {b} bane.", "{a} × {b}... aage dekho."],
  atom: "{v} toot-ta hi nahi.",
  remainder: "{by} se poora nahi jaata, {r} bacha.",
  one: "1 se kuch nahi badla.",
  stop: ["Ek block abhi bhi hil raha hai.", "{composite} ko dekho."],
  solved: "Saare atoms. Wapas {n}!",
};
const fill = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k]);

Screens.game = {
  build() {
    const el = html(`<section class="screen" id="s-game" aria-label="Game: break a number into primes">
      <div class="gm">
        <div class="gm-hud">
          <button class="iconbtn" id="gBack" aria-label="Back to the lesson">${ICON.back}</button>
          <div class="ttl"><b>Todo-Jodo · <span id="gN">72</span></b><span>Break it down to primes</span></div>
          <button class="iconbtn" id="gSnd" aria-label="Sound on" style="margin-left:auto">${ICON.soundOn}</button>
        </div>
        <div class="doors" role="group" aria-label="Choose a level">
          <button class="door" data-n="72" aria-pressed="true">In band · 72</button>
          <button class="door" data-n="360" aria-pressed="false">Harder · 360</button>
        </div>
        <div class="gm-stage" id="gStage">
          <div class="gm-bg scene">${sceneYard()}</div>
          <svg class="gm-bonds" id="gBonds"></svg>
          <div class="blocks" id="gBlocks"></div>
          <canvas class="gm-fx" id="gFx"></canvas>
          <div class="finale" id="gFin"><div class="card panel solid">
            <div class="eyebrow lamp">Back to <span class="fN">72</span></div>
            <h3 id="gFinH"></h3>
            <p>Placed on your terrace, in pencil. It turns to stone when you break a new number on another day, without help.</p>
            <div class="row"><button class="btn ghost" id="gToLesson">Lesson</button><button class="btn lamp" id="gToMap">See your valley</button></div>
          </div></div>
        </div>
        <div class="gm-tray">
          <div class="react" id="gReact" aria-live="polite"><div class="mini"><div class="jharokha" style="clip-path:url(#jhClip)"><div class="jh-face"></div></div></div><div class="t"><b>ASHA</b><span id="gSay"></span></div><span class="sel-lab" id="gLab"></span></div>
          <div class="strip panel" id="gStrip" aria-live="polite"></div>
          <div class="chisel" id="gChisel">${[2, 3, 4, 5, 6, 7, 8, 9].map((d) => `<button data-d="${d}" aria-label="Split by ${d}">${d}</button>`).join("")}</div>
          <div class="gm-actions"><button class="btn ghost" id="gUndo">${ICON.undo}<span>Undo</span></button><button class="btn lamp" id="gDone">${ICON.tick}<span>Done</span></button></div>
        </div>
      </div>
      <div class="placename"></div>
    </section>`);
    $("#tx").appendChild(el);
    this.el = el; this.stage = $("#gStage", el); this.blocks = $("#gBlocks", el); this.bonds = $("#gBonds", el); this.fx = $("#gFx", el);
    $(".mini .jh-face", el).appendChild(posterImg());
    $$(".door", el).forEach((b) => (b.onclick = () => { $$(".door", el).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); Sfx.tock(); this.start(+b.dataset.n); }));
    $$("#gChisel button", el).forEach((b) => (b.onclick = () => this.chisel(+b.dataset.d)));
    $("#gUndo", el).onclick = () => this.undo();
    $("#gDone", el).onclick = () => this.done();
    $("#gBack", el).onclick = () => go("lesson", { back: true });
    $("#gToLesson", el).onclick = () => go("lesson", { back: true });
    $("#gToMap", el).onclick = () => go("map", { focus: 5 });
    $("#gSnd", el).onclick = () => { Sfx.on = !Sfx.on; $("#gSnd", el).innerHTML = Sfx.on ? ICON.soundOn : ICON.sound; $("#gSnd", el).setAttribute("aria-label", Sfx.on ? "Sound on" : "Sound off"); };
    this.parts = []; this.nodes = []; this.hist = [];
    this.ro = new ResizeObserver(() => { this.size(); this.layout(true); }); this.ro.observe(this.stage);
  },
  enter() { placeName(this.el, "Todo-Jodo", "The Stone Yard"); this.start(+$('.door[aria-pressed="true"]', this.el).dataset.n); },
  leave() { cancelAnimationFrame(this.raf); this.raf = 0; },
  size() {
    const b = this.stage.getBoundingClientRect(); this.W = b.width; this.H = b.height;
    const dpr = Math.min(2, devicePixelRatio || 1); this.fx.width = b.width * dpr; this.fx.height = b.height * dpr; this.dpr = dpr;
    this.bonds.setAttribute("viewBox", `0 0 ${b.width} ${b.height}`);
  },
  start(n) {
    this.N = n; $("#gN", this.el).textContent = n; $$(".fN", this.el).forEach((x) => (x.textContent = n));
    this.blocks.innerHTML = ""; this.bonds.innerHTML = ""; this.nodes = []; this.hist = []; this.parts = []; this.finished = false; this.lastReact = 0;
    $("#gFin", this.el).classList.remove("on");
    this.size();
    const root = this.mk(n, null);
    this.layout(true);
    this.select(root);
    this.updateStrip();
    this.say(n === 72 ? "72 ko primes tak todo." : "360, ek circle ke degree. Primes tak todo.", true);
    this.loop();
  },
  mk(v, parent) {
    const id = this.nodes.length;
    const n = { id, v, parent, kids: [], state: isPrime(v) ? "prime" : "whole", depth: parent ? parent.depth + 1 : 0, x: parent ? parent.x : this.W / 2, y: parent ? parent.y : 60, vx: 0, vy: 0, tx: 0, ty: 0, sc: 1 };
    const b = document.createElement("button");
    b.className = "blk"; b.innerHTML = `<span class="face"></span><span class="num">${v}</span>`;
    b.onclick = () => this.tapBlock(n);
    n.el = b; this.blocks.appendChild(b); this.nodes.push(n);
    if (parent) parent.kids.push(n);
    this.paint(n, true);
    return n;
  },
  paint(n, quiet) {
    const b = n.el;
    b.classList.toggle("split", n.state === "split"); b.classList.toggle("prime", n.state === "prime" && !n.pending);
    b.setAttribute("aria-label", n.state === "split" ? `${n.v}, split into ${n.kids.map((k) => k.v).join(" and ")}` : n.state === "prime" ? `${n.v}, prime: it will not split` : `${n.v}: tap to split`);
    if (n.state === "prime" && !n.pending && !b.querySelector(".lbl")) b.insertAdjacentHTML("beforeend", `<span class="lbl">PRIME</span>`);
  },
  leaves() { const out = []; const walk = (n) => (n.kids.length ? n.kids.forEach(walk) : out.push(n)); walk(this.nodes[0]); return out; },
  layout(snap) {
    if (!this.nodes.length) return;
    const L = this.leaves(), maxD = Math.max(...this.nodes.map((n) => n.depth));
    const top = this.H > 600 ? 96 : 66, rowH = Math.min(this.H > 600 ? 128 : 96, (this.H - top - 70) / Math.max(1, maxD));
    const colW = (this.W - 20) / L.length;
    this.bs = Math.max(44, Math.min(this.H > 600 ? 84 : 62, rowH * 0.66, colW * 0.84));
    L.forEach((n, i) => (n.tx = 10 + (i + 0.5) * colW));
    const up = (n) => { if (n.kids.length) { n.kids.forEach(up); n.tx = (n.kids[0].tx + n.kids[n.kids.length - 1].tx) / 2; } n.ty = top + n.depth * rowH; };
    up(this.nodes[0]);
    this.nodes.forEach((n) => { if (n._bs !== this.bs) { n._bs = this.bs; n.el.style.width = n.el.style.height = this.bs + "px"; n.el.style.margin = `${-this.bs / 2}px 0 0 ${-this.bs / 2}px`; n.el.style.fontSize = Math.round(this.bs * 0.38) + "px"; } if (snap) { n.x = n.tx; n.y = n.ty; } });
    this.render();
  },
  select(n) {
    this.sel = n; this.nodes.forEach((m) => m.el.classList.toggle("sel", m === n));
    const lab = $("#gLab", this.el);
    if (n && n.state === "whole") { lab.innerHTML = `Split <b>${n.v}</b> by`; $$("#gChisel button", this.el).forEach((b) => (b.disabled = false)); }
    else { lab.innerHTML = "Tap a block"; $$("#gChisel button", this.el).forEach((b) => (b.disabled = true)); }
  },
  tapBlock(n) {
    Sfx.ensure();
    if (this.finished) return;
    if (n.state === "prime") { this.wobble(n); Sfx.tock(); this.say(fill(BANK.atom, { v: n.v }), true); return; }
    if (n.state === "split") { this.select(null); return; }
    Sfx.tock(); this.select(n);
  },
  wobble(n) { if (!RM) n.el.animate([{ rotate: "0deg" }, { rotate: "-6deg" }, { rotate: "5deg" }, { rotate: "-3deg" }, { rotate: "0deg" }], { duration: 360, easing: "ease-out" }); },
  async chisel(d) {
    const n = this.sel; if (!n || n.state !== "whole" || this.busy) return;
    Sfx.ensure();
    if (d === n.v) { this.wobble(n); Sfx.tock(); this.say(`${n.v} ÷ ${n.v} = 1. ` + BANK.one, true); this.floatChip(n, `${n.v} ÷ ${n.v} = 1`); return; }
    if (n.v % d) {
      const q = Math.floor(n.v / d), r = n.v % d;
      this.wobble(n); Sfx.tock(); this.dust(n.x, n.y, 6, true);
      this.floatChip(n, `${n.v} ÷ ${d} = ${q}, ${r} left`);
      this.say(fill(BANK.remainder, { by: d, r }), true); return;
    }
    // the split: anticipation, hit-stop, crack, shake, dust, the halves spring apart
    this.busy = true;
    const a = d, b = n.v / d;
    if (!RM) { await n.el.animate([{ transform: n.el.style.transform }, { transform: n.el.style.transform + " scale(1.1, .86)" }], { duration: 80, easing: "ease-in" }).finished.catch(() => {}); await sleep(55); }
    Sfx.crack(); this.shake(); this.dust(n.x, n.y, 18);
    n.el.insertAdjacentHTML("beforeend", `<svg class="crack" viewBox="0 0 60 60"><path d="M30,2 L26,16 L33,26 L27,38 L32,48 L29,58" stroke="#3A1E1A" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>`);
    n.state = "split";
    const k1 = this.mk(a, n), k2 = this.mk(b, n);
    [k1, k2].forEach((k, i) => { k.vx = (i ? 1 : -1) * 520; k.vy = -260; if (k.state === "prime") { k.pending = true; this.paint(k); } });
    this.paint(n);
    this.hist.push(n);
    this.layout(false);
    this.select(k2.state === "whole" ? k2 : k1.state === "whole" ? k1 : null);
    this.updateStrip();
    setTimeout(() => {
      [k1, k2].forEach((k, i) => { if (k.pending) setTimeout(() => this.crystallise(k), i * 140); });
      this.busy = false;
    }, RM ? 0 : 380);
    const now = performance.now();
    if (now - this.lastReact > 4000) { this.lastReact = now; const t = BANK.progress[this.hist.length % 3]; this.say(fill(t, { v: n.v, a, b })); }
  },
  crystallise(k) {
    if (!k.el.isConnected) return;
    k.pending = false; this.paint(k);
    Sfx.bell(520 + Math.min(9, k.v) * 70, 0.16);
    this.spark(k.x, k.y);
    if (!RM) k.el.animate([{ transform: k.el.style.transform + " scale(.7)" }, { transform: k.el.style.transform + " scale(1.16)" }, { transform: k.el.style.transform }], { duration: 520, easing: "cubic-bezier(.3,1.5,.5,1)" });
  },
  undo() {
    if (this.busy || this.finished) return;
    const n = this.hist.pop(); if (!n) return;
    Sfx.tock();
    const gone = new Set(); const walk = (m) => { m.kids.forEach(walk); if (m !== n) gone.add(m); }; walk(n);
    gone.forEach((m) => { m.el.remove(); });
    this.nodes = this.nodes.filter((m) => !gone.has(m)); n.kids = []; n.state = "whole";
    n.el.querySelector(".crack")?.remove();
    this.paint(n); this.layout(false); this.select(n); this.updateStrip();
  },
  async done() {
    if (this.finished || this.busy) return;
    Sfx.ensure();
    const comp = this.leaves().filter((n) => n.state === "whole");
    if (comp.length) {
      comp.forEach((n) => { n.el.classList.add("hum"); setTimeout(() => n.el.classList.remove("hum"), 1700); });
      this.say(comp.length > 1 ? BANK.stop[0] : fill(BANK.stop[1], { composite: comp[0].v }), true);
      this.select(comp[0]);
      return;
    }
    this.finished = true; this.select(null);
    // the atoms come home: they gather in a row and multiply back into the number
    const L = this.leaves().slice().sort((a, b) => a.v - b.v);
    const y = this.H - 70, w = Math.min(58, (this.W - 40) / L.length);
    L.forEach((n, i) => { n.tx = this.W / 2 + (i - (L.length - 1) / 2) * w; n.ty = y; });
    let acc = 1; const strip = $("#gStrip", this.el);
    for (let i = 0; i < L.length; i++) {
      await sleep(RM ? 40 : 230); acc *= L[i].v;
      strip.innerHTML = L.slice(0, i + 1).map((n) => `<span class="p">${n.v}</span>`).join(ops(" × ")) + (i ? ` ${ops("=")} <span>${acc}</span>` : "");
      Sfx.bell(440 * Math.pow(2, i / 7), 0.12); this.spark(L[i].tx, y, 6);
    }
    const root = this.nodes[0];
    root.el.classList.remove("split"); root.el.querySelector(".crack")?.remove(); root.el.classList.add("sel");
    Sfx.finale(); this.spark(root.x, root.y, 28); this.ring(root.x, root.y);
    this.say(fill(BANK.solved, { n: this.N }), true);
    $("#gFinH", this.el).innerHTML = ops(`${this.N} = ${L.map((n) => n.v).join(" × ")}`);
    setTimeout(() => { if (this.finished && CUR === "game") $("#gFin", this.el).classList.add("on"); }, RM ? 300 : 1500);
  },
  updateStrip() {
    const L = this.leaves();
    $("#gStrip", this.el).innerHTML = L.length === 1 ? `<span>${this.N}</span>` : `<span>${this.N}</span> ${ops("=")} ` + L.map((n) => (n.state === "prime" ? `<span class="p">${n.v}</span>` : `<span>${n.v}</span>`)).join(ops(" × "));
  },
  floatChip(n, txt) {
    const c = html(`<div style="position:absolute;z-index:7;left:${n.x}px;top:${n.y - this.bs / 2 - 30}px;transform:translateX(-50%);padding:4px 10px;font:600 15px var(--f-ui);color:#E6F4FF;background:rgba(18,30,52,.92);border:1px solid rgba(134,201,246,.6);white-space:nowrap;pointer-events:none">${txt}</div>`);
    this.stage.appendChild(c);
    c.animate([{ opacity: 0, transform: "translate(-50%,6px)" }, { opacity: 1, transform: "translate(-50%,0)", offset: 0.15 }, { opacity: 1, offset: 0.8 }, { opacity: 0, transform: "translate(-50%,-8px)" }], { duration: 2200, easing: "ease-out" }).finished.then(() => c.remove());
  },
  say(t, force) {
    const r = $("#gReact", this.el), sp = $("#gSay", this.el); sp.textContent = t; r.classList.add("show");
    if (!RM) sp.animate([{ opacity: 0, transform: "translateY(4px)" }, { opacity: 1, transform: "none" }], { duration: 260, easing: "cubic-bezier(.22,.8,.2,1)" });
  },
  shake() {
    if (RM) return; const s = this.stage, t0 = performance.now();
    const f = (now) => { const k = 1 - (now - t0) / 240; if (k <= 0) { s.style.transform = ""; return; } s.style.transform = `translate(${((Math.random() - 0.5) * 6 * k).toFixed(1)}px, ${((Math.random() - 0.5) * 5 * k).toFixed(1)}px)`; requestAnimationFrame(f); };
    requestAnimationFrame(f);
  },
  dust(x, y, n, small) { if (RM) return; for (let i = 0; i < n; i++) { const a = -Math.PI * (0.1 + Math.random() * 0.8); const sp = (small ? 60 : 140) + Math.random() * 160; this.parts.push({ k: "dust", x, y: y + 8, vx: Math.cos(a) * sp * (Math.random() < 0.5 ? -1 : 1), vy: Math.sin(a) * sp, life: 1, s: 2 + Math.random() * 3.5, c: Math.random() < 0.5 ? "232,176,130" : "201,140,100" }); } this.loop(); },
  spark(x, y, n = 14) { if (RM) return; for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, sp = 80 + Math.random() * 180; this.parts.push({ k: "spark", x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, s: 1.4 + Math.random() * 2 }); } this.parts.push({ k: "ring", x, y, life: 1, r: 10 }); this.loop(); },
  ring(x, y) { if (RM) return; this.parts.push({ k: "ring", x, y, life: 1, r: 20, big: true }); },
  loop() { if (!this.raf) { this.t = performance.now(); this.raf = requestAnimationFrame((t) => this.step(t)); } },
  step(now) {
    const dt = Math.min(0.033, (now - this.t) / 1000); this.t = now;
    let moving = false;
    for (const n of this.nodes) {
      if (RM) { n.x = n.tx; n.y = n.ty; continue; }
      const ax = 260 * (n.tx - n.x) - 22 * n.vx, ay = 260 * (n.ty - n.y) - 22 * n.vy;
      n.vx += ax * dt; n.vy += ay * dt; n.x += n.vx * dt; n.y += n.vy * dt;
      if (Math.abs(n.tx - n.x) + Math.abs(n.ty - n.y) + Math.abs(n.vx) * 0.01 + Math.abs(n.vy) * 0.01 > 0.3) moving = true;
    }
    this.render();
    const c = this.fx.getContext("2d"); c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); c.clearRect(0, 0, this.W, this.H);
    this.parts = this.parts.filter((p) => (p.life -= dt * (p.k === "ring" ? (p.big ? 0.9 : 1.6) : p.k === "spark" ? 1.3 : 1.1)) > 0);
    for (const p of this.parts) {
      if (p.k === "ring") { p.r += dt * (p.big ? 260 : 140); c.strokeStyle = `rgba(255,214,140,${(p.life * 0.8).toFixed(3)})`; c.lineWidth = p.big ? 3 : 2; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.283); c.stroke(); continue; }
      p.vy += (p.k === "dust" ? 520 : 60) * dt; p.vx *= 0.985; p.x += p.vx * dt; p.y += p.vy * dt;
      c.fillStyle = p.k === "dust" ? `rgba(${p.c},${(p.life * 0.9).toFixed(3)})` : `rgba(255,${(200 + p.life * 40) | 0},120,${p.life.toFixed(3)})`;
      c.beginPath(); c.arc(p.x, p.y, p.s * (p.k === "spark" ? p.life : 1), 0, 6.283); c.fill();
    }
    if (moving || this.parts.length) this.raf = requestAnimationFrame((t) => this.step(t)); else this.raf = 0;
  },
  render() {
    for (const n of this.nodes) { const t = `translate(${n.x.toFixed(1)}px, ${n.y.toFixed(1)}px)`; if (n._t !== t) { n.el.style.transform = t; n.el.style.setProperty("--pos", t); n._t = t; } }
    // bonds: persistent paths, only their d changes per frame (no innerHTML churn)
    const want = [];
    for (const n of this.nodes) for (const k of n.kids) want.push([n, k]);
    while (this.bonds.childNodes.length < want.length * 2) {
      const glow = document.createElementNS("http://www.w3.org/2000/svg", "path"); glow.setAttribute("stroke", "rgba(255,200,120,.28)"); glow.setAttribute("stroke-width", "7"); glow.setAttribute("fill", "none"); glow.setAttribute("stroke-linecap", "round");
      const line = document.createElementNS("http://www.w3.org/2000/svg", "path"); line.setAttribute("stroke", "#E9B15C"); line.setAttribute("stroke-width", "2.4"); line.setAttribute("fill", "none"); line.setAttribute("stroke-linecap", "round");
      this.bonds.append(glow, line);
    }
    while (this.bonds.childNodes.length > want.length * 2) this.bonds.lastChild.remove();
    want.forEach(([n, k], i) => {
      const my = ((n.y + k.y) / 2).toFixed(1);
      const d = `M${n.x.toFixed(1)},${(n.y + this.bs * 0.4).toFixed(1)} C${n.x.toFixed(1)},${my} ${k.x.toFixed(1)},${my} ${k.x.toFixed(1)},${(k.y - this.bs * 0.45).toFixed(1)}`;
      const a = this.bonds.childNodes[i * 2], b = this.bonds.childNodes[i * 2 + 1];
      if (a.getAttribute("d") !== d) { a.setAttribute("d", d); b.setAttribute("d", d); }
    });
  },
};
