/* ============================================================
   1 · HELLO — dawn at the gate; choosing your teacher
   ============================================================ */
const HELLO_LINES = [
  [0.00, "Namaste! Main Asha didi hoon,"],
  [0.20, "ek computer teacher, insaan nahi."],
  [0.38, "Main aapke bacche se baat karke padhaati hoon,"],
  [0.66, "aur aapko dikhaati hoon ki usne sach mein kya samjha."],
];
function parallax(root) {
  if (RM) return () => {};
  const layers = $$(".layer", root);
  let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
  const move = (e) => { const b = root.getBoundingClientRect(); tx = ((e.clientX - b.left) / b.width - 0.5) * 2; ty = ((e.clientY - b.top) / b.height - 0.5) * 2; if (!raf) raf = requestAnimationFrame(step); };
  const step = () => { raf = 0; cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
    layers.forEach((l) => { const d = +l.dataset.depth || 0; l.style.transform = `translate(${(-cx * d * 26).toFixed(1)}px, ${(-cy * d * 10).toFixed(1)}px)`; });
    if (Math.abs(tx - cx) + Math.abs(ty - cy) > 0.002) raf = requestAnimationFrame(step); };
  root.addEventListener("pointermove", move);
  return () => root.removeEventListener("pointermove", move);
}
function settleLayers(root) { // the camera arrives: far layers settle last
  if (RM) return;
  $$(".layer", root).forEach((l) => { const d = +l.dataset.depth || 0;
    l.animate([{ transform: `translateY(${(d * 46).toFixed(0)}px)` }, { transform: "translateY(0)" }], { duration: 1500 + d * 600, easing: "cubic-bezier(.2,.8,.2,1)" }); });
}

Screens.hello = {
  build() {
    const el = html(`<section class="screen" id="s-hello" aria-label="First run: choose your teacher">
      <div class="scene">${sceneDawn()}</div>
      <div class="h-veil on" id="hVeilA" style="background:linear-gradient(180deg,rgba(20,10,28,0) 52%,rgba(20,10,28,.5) 74%,rgba(16,8,22,.78) 100%)"></div>
      <div class="h-veil" id="hVeilB"></div>
      <div class="h-ui">
        <div class="h-step" data-step="a">
          <div class="brandmark" style="color:#FBEBDD">${BRAND}<span>TAXILA</span></div>
          <div class="h-title">
            <div class="eyebrow" style="color:rgba(251,235,221,.78)">Your AI teacher · Classes 4 to 9</div>
            <h1 style="color:#FFF4E6" aria-label="Taxila">${"Taxila".split("").map((c, i) => `<span class="lt" style="animation-delay:${300 + i * 70}ms">${c}</span>`).join("")}</h1>
            <p style="color:#F1DCD2">A teacher who talks with you, in Hinglish, Hindi or English. And a world that lights up as you understand it.</p>
            <button class="btn lamp" id="hMeet">Meet your teacher</button>
            <div class="h-foot" style="color:rgba(251,235,221,.72)">Set up by your grown-up. Nothing here can go wrong.</div>
          </div>
        </div>
        <div class="h-step" data-step="b" hidden>
          <div class="pick-head"><div class="eyebrow">Choose your teacher</div><h2>Who would you like to learn with?</h2></div>
          <div class="niches">
            <div class="niche" data-t="asha">
              <div class="win">${jharokha()}</div>
              <div class="nm">Asha</div><div class="meta">Classes 4 to 7<br>Hinglish, Hindi, English</div><span class="tag">AI TEACHER</span>
              <button class="pickhit" aria-label="Choose Asha"></button>
            </div>
            <div class="niche" data-t="arjun">
              <div class="win"><div class="jharokha" style="clip-path:url(#jhClip)">
                  <svg class="silh" viewBox="0 0 100 130" preserveAspectRatio="none"><defs><radialGradient id="arjL" cx=".5" cy=".42" r=".6"><stop offset="0" stop-color="#FFE3B0"/><stop offset="1" stop-color="#E7A86A"/></radialGradient></defs>
                  <rect width="100" height="130" fill="url(#arjL)"/><path d="M50,30 c11,0 18,8 18,20 c0,10 -5,18 -11,21 l0,8 c14,3 30,10 34,22 l0,29 l-82,0 l0,-29 c4,-12 20,-19 34,-22 l0,-8 c-6,-3 -11,-11 -11,-21 c0,-12 7,-20 18,-20z" fill="#5A3446" opacity=".78"/></svg>
                  <div class="chik"></div></div>
                ${jhFrame()}</div>
              <div class="nm">Arjun</div><div class="meta">Classes 5 to 9<br>Face still being made</div><span class="tag">AI TEACHER</span>
              <button class="pickhit" aria-label="Choose Arjun"></button>
            </div>
          </div>
          <div class="hear"><button class="btn ghost light" id="hHear">${ICON.speaker}<span>Hear Asha</span></button></div>
          <div class="capbox panel" aria-live="polite"><div class="who">Asha · AI teacher</div><div class="txt" id="hCap">Tap “Hear Asha”. She introduces herself in her own voice.</div></div>
          <div class="pick-cta"><button class="btn lamp block" id="hGo">Learn with Asha</button></div>
        </div>
      </div>
      <div class="placename"></div>
    </section>`);
    $("#tx").appendChild(el);
    this.el = el;
    const stepA = $('[data-step="a"]', el), stepB = $('[data-step="b"]', el), gate = $(".gate", el);
    const ashaWin = $('.niche[data-t="asha"] .win', el);
    let pick = "asha";
    const setPick = (t) => {
      pick = t;
      $$(".niche", el).forEach((n) => { n.classList.toggle("sel", n.dataset.t === t); n.classList.toggle("dim", n.dataset.t !== t); });
      const cap = $("#hCap");
      if (t === "arjun") { cap.textContent = "Arjun’s face isn’t finished yet, so this prototype carries on with Asha. In the product, the child picks by hearing both."; $("#hGo").textContent = "Carry on with Asha"; }
      else { cap.textContent = "Asha teaches by talking with you. She will always tell you she is an AI."; $("#hGo").textContent = "Learn with Asha"; }
    };
    $("#hMeet").onclick = () => {
      Sfx.ensure();
      const s = seq();
      if (RM) { gate.style.opacity = "0"; } else {
        gate.animate([{ transform: "scale(1)", opacity: 1 }, { transform: "scale(3.1)", opacity: 0 }], { duration: 1150, easing: "cubic-bezier(.65,0,.2,1)", fill: "forwards" });
      }
      stepA.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: "forwards" });
      $("#hVeilA", el).classList.remove("on"); $("#hVeilB", el).classList.add("on");
      setTimeout(() => { if (!s.alive()) return; stepA.hidden = true; stepB.hidden = false; Face.attach(ashaWin, [150, 40, 724]); setPick("asha");
        $$(".pick-head, .niche, .hear, .capbox, .pick-cta", el).forEach((n, i) => n.animate([{ opacity: 0, transform: "translateY(16px)" }, { opacity: 1, transform: "none" }], { duration: 560, delay: i * 70, easing: "cubic-bezier(.22,.8,.2,1)", fill: "backwards" })); }, RM ? 60 : 700);
    };
    $$(".pickhit", el).forEach((b) => (b.onclick = () => { Sfx.tock(); setPick(b.parentElement.dataset.t); }));
    $("#hHear").onclick = () => {
      Sfx.ensure(); setPick("asha");
      const cap = $("#hCap"), btn = $("#hHear");
      if (Face.clip) { Face.stopClip(); btn.lastElementChild.textContent = "Hear Asha"; return; }
      btn.lastElementChild.textContent = "Stop";
      const a = Face.playClip(PACK.audio, () => { btn.lastElementChild.textContent = "Hear again"; Face.setStatus(null); });
      const tick = () => { if (!Face.clip || Face.clip !== a) return; const p = a.duration ? a.currentTime / a.duration : 0;
        let line = HELLO_LINES[0][1]; for (const [at, t] of HELLO_LINES) if (p >= at) line = t;
        if (cap.textContent !== line) { cap.textContent = line; cap.animate([{ opacity: 0 }, { opacity: 1 }], 200); }
        requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    };
    $("#hGo").onclick = () => { Face.stopClip(); go("home", { from: centerOf($('.niche[data-t="asha"] .win', el)) }); };
    this.unpar = parallax(el);
  },
  enter() {
    const el = this.el, stepA = $('[data-step="a"]', el), stepB = $('[data-step="b"]', el), gate = $(".gate", el);
    gate.getAnimations().forEach((a) => a.cancel()); gate.style.opacity = "";
    stepA.getAnimations().forEach((a) => a.cancel());
    stepA.hidden = false; stepB.hidden = true;
    $$(".lt", el).forEach((l) => { l.style.animation = "none"; void l.offsetWidth; l.style.animation = ""; });
    $("#hVeilA", el).classList.add("on"); $("#hVeilB", el).classList.remove("on");
    settleLayers(el);
  },
  leave() { Face.stopClip(); },
};

/* ============================================================
   2 · HOME — the terrace at dusk
   ============================================================ */
const GLYPH_STATES = ["", "not yet", "working on it", "got it", "secure"];
function stateGlyph(s, now = false) {
  // the same pavilion at four stages: a chalk plan, a scaffold, a lit scaffold, carved stone with a lamp
  const stone = "#C9906A", shade = "#7B4E62";
  if (s === 1) return `<svg viewBox="0 0 44 44"><g fill="none" stroke="#9FB6E8" stroke-width="1.6" stroke-dasharray="3 3" opacity=".85"><path d="M10,34 H34 M13,34 V22 M31,34 V22 M11,22 H33 M13,22 C13,14 20,13 22,8 C24,13 31,14 31,22"/></g>${now ? '<circle cx="22" cy="24" r="17" fill="none" stroke="#FFC24D" stroke-width="1.6"/>' : ""}</svg>`;
  const base = `<path d="M9,36 H35 V33 H9 Z" fill="${stone}"/><rect x="12" y="21" width="3.4" height="12" fill="${stone}"/><rect x="28.6" y="21" width="3.4" height="12" fill="${shade}"/>`;
  const roof = `<path d="M10,21 H34 L35,19 H9 Z" fill="${stone}"/><path d="M12,19 C12,12 19,11 22,6 C25,11 32,12 32,19 Z" fill="url(#gBrass)" opacity=".95"/>`;
  const scaff = `<g stroke="#D7AE72" stroke-width="1.3" stroke-linecap="round"><path d="M7,36 V10 M37,36 V10 M7,16 H37 M7,27 H37"/></g>`;
  const lamp = (r) => `<circle cx="22" cy="27" r="${r}" fill="#FFC24D" opacity=".28"/><circle cx="22" cy="27" r="2.6" fill="#FFE2A1"/>`;
  if (s === 2) return `<svg viewBox="0 0 44 44">${base}${scaff}${now ? '<circle cx="22" cy="24" r="19" fill="none" stroke="#FFC24D" stroke-width="1.6"/>' : ""}</svg>`;
  if (s === 3) return `<svg viewBox="0 0 44 44">${base}${roof}${scaff}${lamp(7)}</svg>`;
  return `<svg viewBox="0 0 44 44"><circle cx="22" cy="24" r="20" fill="#FFC24D" opacity=".12"/>${base}${roof}${lamp(9)}</svg>`;
}
const CH5 = [
  { id: "t01", t: "Common factors and multiples", s: 4 },
  { id: "t02", t: "Prime and composite numbers", s: 3 },
  { id: "t03", t: "Co-prime numbers", s: 1 },
  { id: "t04", t: "Prime factorisation", s: 2, now: true },
  { id: "t05", t: "Divisibility tests", s: 1 },
];
Screens.home = {
  build() {
    const pos = { t01: [22, 40], t02: [92, 40], t03: [166, 16], t04: [166, 64], t05: [240, 64] };
    const edges = [["t01", "t02"], ["t02", "t03"], ["t02", "t04"], ["t04", "t05"]];
    const graph = `<div style="position:relative;height:96px;margin:14px 0 6px">
      <svg viewBox="0 0 262 88" style="position:absolute;inset:0;width:100%;height:100%" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        ${edges.map(([a, b]) => `<path d="M${pos[a][0]},${pos[a][1]} C${(pos[a][0] + pos[b][0]) / 2},${pos[a][1]} ${(pos[a][0] + pos[b][0]) / 2},${pos[b][1]} ${pos[b][0]},${pos[b][1]}" stroke="${CH5.find((x) => x.id === b).s >= 3 ? "rgba(255,194,77,.7)" : "rgba(211,200,224,.35)"}" stroke-width="1.6" fill="none"/>`).join("")}
      </svg>
      ${CH5.map((c) => `<button class="idea-b" data-id="${c.id}" aria-label="${c.t}: ${GLYPH_STATES[c.s]}" style="position:absolute;left:calc(${(pos[c.id][0] / 262) * 100}% - 22px);top:calc(${(pos[c.id][1] / 88) * 100}% - 22px);width:44px;height:44px">${stateGlyph(c.s, c.now)}</button>`).join("")}
    </div>
    <div class="idea-cap" style="min-height:44px;font:500 15px/1.4 var(--f-ui);color:var(--ink-2)"></div>`;
    const el = html(`<section class="screen" id="s-home" aria-label="Home">
      <div class="home-scroll">
        <div class="home-scene">
          <div class="scene">${sceneDusk()}</div>
          <div class="asha-win">${jharokha()}</div>
          <div class="home-top"><div class="who"><div class="avatar">R</div><div><div class="nm">Riya</div><div class="cl">Class 6 · Maths</div></div></div>
            <button class="grownups" id="kGrown">${ICON.door.replace("<svg", '<svg style="width:18px;height:18px;vertical-align:-4px;margin-right:4px"')}Grown-ups</button></div>
          <div class="greet panel" aria-live="polite"><div class="who"><b>Asha</b><span class="floor" id="kFloor"></span></div><div class="txt" id="kCap">Kal tumne common factors pakke kiye. Aaj ek number ko uske primes tak todenge.</div></div>
        </div>
        <div class="home-body">
          <div class="home-greet-wrap"></div>
          <div class="today panel solid rise">
            <div class="eyebrow lamp">Today · Chapter 5, Prime Time</div>
            <h2>Prime factorisation</h2>
            <div class="sub">Breaking a number down until only primes are left · about 20 minutes</div>
            ${graph}
            <button class="btn lamp block" id="kBegin">${ICON.play}<span>Begin with Asha</span></button>
          </div>
          <div class="wayback rise" style="animation-delay:80ms">
            <button class="wb panel" id="kParked"><div class="eyebrow">Parked question</div><div class="q">“1 prime kyun nahi hai?”</div><div class="s">${ICON.lantern}You asked on Wednesday</div></button>
            <button class="wb panel" id="kPractice"><div class="eyebrow">On your own</div><div class="q">Break a number into primes</div><div class="s">${ICON.repeat}A game, no clock</div></button>
          </div>
          <button class="worldpeek panel rise" style="animation-delay:160ms" id="kWorld">${scenePeek()}<div class="lab"><div><b>Your valley</b><small>Prime Time is being built</small></div><span class="chipbtn">Open</span></div></button>
        </div>
      </div>
      <div class="placename"></div>
    </section>`);
    $("#tx").appendChild(el);
    this.el = el;
    const cap = $(".idea-cap", el);
    const showIdea = (id) => { const c = CH5.find((x) => x.id === id); cap.innerHTML = `<b style="color:${c.now ? "var(--lamp)" : "var(--ink)"};font-weight:600">${c.now ? "Today · " : ""}${c.t}</b> · ${GLYPH_STATES[c.s]}`; };
    $$(".idea-b", el).forEach((b) => (b.onclick = () => { Sfx.tock(); showIdea(b.dataset.id); }));
    showIdea("t04");
    $("#kBegin").onclick = () => { Sfx.ensure(); go("lesson", { from: centerOf($(".asha-win", this.el)) }); };
    $("#kPractice").onclick = () => { Sfx.ensure(); go("game", { from: centerOf($("#kPractice")) }); };
    $("#kWorld").onclick = () => go("map", { from: centerOf($("#kWorld")) });
    $("#kGrown").onclick = () => go("parent");
    $("#kParked").onclick = () => this.speak("Haan, yaad hai. Aaj ka lesson khatam hote hi isi sawaal se shuru karenge.");
    this.unpar = parallax($(".home-scene", el));
    this.ro = new ResizeObserver(() => this.place()); this.ro.observe(el);
  },
  place() {
    const greet = $(".greet", this.el), narrow = this.el.clientWidth < 900;
    const want = narrow ? $(".home-greet-wrap", this.el) : $(".home-scene", this.el);
    if (greet.parentElement !== want) want.appendChild(greet);
    const slot = $("#ashaSlot", this.el), win = $(".asha-win", this.el), host = $(".home-scene", this.el);
    if (!slot) return; const a = slot.getBoundingClientRect(), b = host.getBoundingClientRect();
    if (!a.width) return;
    Object.assign(win.style, { left: a.left - b.left + "px", top: a.top - b.top + "px", width: a.width + "px", height: a.height + "px" });
  },
  async speak(text) {
    const s = seq(), cap = $("#kCap", this.el), fl = $("#kFloor", this.el);
    cap.textContent = text; cap.animate([{ opacity: 0 }, { opacity: 1 }], 220);
    const dur = Face.say(text); fl.innerHTML = `<i>${FLOOR.speaking}</i>Talking`;
    await sleep(dur); if (!s.alive()) return; Face.setStatus(null); fl.innerHTML = "";
  },
  enter() {
    requestAnimationFrame(() => { this.place(); Face.attach($(".asha-win", this.el), [170, 50, 690]); });
    placeName(this.el, "Riya · Class 6", "The Terrace", "12%");
    settleLayers($(".home-scene", this.el));
    setTimeout(() => { if (CUR === "home") this.speak("Kal tumne common factors pakke kiye. Aaj ek number ko uske primes tak todenge."); }, 1200);
  },
  leave() { Face.setStatus(null); },
};
