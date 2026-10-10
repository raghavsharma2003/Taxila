/* Asha (grown-up, option 4 "Lamplight flat", lamp1 layers) as a light DOM puppet for the U1 prototypes.
   Layers come from art/character/puppet2d/lamp1 (inlined by build.mjs as window.ASHA_L / ASHA_R).
   This is a design stand-in for the real TxPuppet runtime: blink, eye drift, brows, breath, sway and a jaw
   driven by a syllable envelope. States: idle | listen | speak | think. */
(function () {
  const ORDER = ['hairback', 'bun', 'body', 'ears', 'face',
    'scleraL', 'scleraR', 'irisL', 'irisR', 'catchL', 'catchR', 'lowerL', 'lowerR', 'lidL', 'lidR',
    'browL', 'browR', 'MOUTH', 'lockbed', 'hair', 'lockL', 'lockR'];
  const VIEWS = { close: [160, 40, 730, 730], medium: [110, 25, 830, 875], bust: [40, 0, 984, 1024] };
  const SEAM = 603; // lip seam y in rig space
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function mount(host, opt = {}) {
    const R = window.ASHA_R, L = window.ASHA_L;
    const v = VIEWS[opt.view || 'close'];
    const vw = v[2] - v[0], vh = v[3] - v[1];
    host.classList.add('asha-host');
    const rig = document.createElement('div');
    rig.className = 'asha-rig';
    rig.setAttribute('role', 'img');
    rig.setAttribute('aria-label', opt.label || 'Asha');
    Object.assign(rig.style, { position: 'absolute', inset: '0', overflow: 'hidden' });
    const head = document.createElement('div');
    Object.assign(head.style, { position: 'absolute', left: (-v[0] / vw * 100) + '%', top: (-v[1] / vh * 100) + '%',
      width: (1024 / vw * 100) + '%', height: (1024 / vh * 100) + '%', transformOrigin: '51% 72%' });
    rig.appendChild(head);
    const el = {};
    const pct = (r) => ({ left: r[0] / 10.24 + '%', top: r[1] / 10.24 + '%', width: (r[2] - r[0]) / 10.24 + '%', height: (r[3] - r[1]) / 10.24 + '%' });
    const img = (k, r) => { const i = document.createElement('img'); i.src = L[k]; i.alt = ''; i.draggable = false;
      Object.assign(i.style, { position: 'absolute', display: 'block', pointerEvents: 'none' }, pct(r)); return i; };
    for (const k of ORDER) {
      if (k === 'MOUTH') {
        const r = R.mouth_rest; const m = document.createElement('div');
        Object.assign(m.style, { position: 'absolute' }, pct(r));
        const seamPct = (SEAM - r[1]) / (r[3] - r[1]) * 100;
        const cav = document.createElement('div');
        Object.assign(cav.style, { position: 'absolute', left: '22%', width: '56%', top: (seamPct - 4) + '%', height: '8%',
          background: 'radial-gradient(ellipse at 50% 40%, #5a2320 0 55%, #3a1414 80%)', borderRadius: '50%', transformOrigin: '50% 30%' });
        const up = document.createElement('img'); up.src = L.mouth_rest; up.alt = '';
        const lo = document.createElement('img'); lo.src = L.mouth_rest; lo.alt = '';
        for (const i of [up, lo]) Object.assign(i.style, { position: 'absolute', inset: '0', width: '100%', height: '100%' });
        up.style.clipPath = `inset(0 0 ${100 - seamPct}% 0)`;
        lo.style.clipPath = `inset(${seamPct}% 0 0 0)`;
        m.append(cav, lo, up); head.appendChild(m); el.mouth = { m, cav, lo, up };
        continue;
      }
      const i = img(k, R[k]); head.appendChild(i); el[k] = i;
      if (k === 'lidL' || k === 'lidR') {
        const s = k.slice(-1);
        el['mid' + s] = img('lidmid' + s, R['lidmid' + s]); el['shut' + s] = img('lidshut' + s, R['lidshut' + s]);
        el['mid' + s].style.opacity = 0; el['shut' + s].style.opacity = 0;
        head.append(el['mid' + s], el['shut' + s]);
      }
    }
    host.appendChild(rig);

    let state = opt.state || 'idle', t0 = performance.now(), nextBlink = t0 + 1200, blinkT = -1, look = [0, 0], lookTo = [0, 0], nextLook = t0 + 900;
    let speakUntil = 0, jaw = 0, brow = 0, raf = 0, alive = true;
    function setState(s, ms) { state = s; if (s === 'speak') speakUntil = performance.now() + (ms || 2600); host.dataset.ashaState = s; }
    function lid(s, a) { el['lid' + s].style.opacity = a === 0 ? 1 : 0; el['mid' + s].style.opacity = a === 1 ? 1 : 0; el['shut' + s].style.opacity = a === 2 ? 1 : 0;
      for (const k of ['sclera', 'iris', 'catch', 'lower']) el[k + s].style.opacity = a === 2 ? 0 : 1; }
    function frame(now) {
      if (!alive) return;
      const t = (now - t0) / 1000;
      if (state === 'speak' && now > speakUntil) setState('idle');
      // blink
      if (now > nextBlink && blinkT < 0) blinkT = now;
      let a = 0;
      if (blinkT >= 0) { const d = now - blinkT; a = d < 45 ? 1 : d < 110 ? 2 : d < 160 ? 1 : 0; if (d >= 160) { blinkT = -1; nextBlink = now + 2200 + Math.random() * 3200; } }
      lid('L', a); lid('R', a);
      // gaze
      if (now > nextLook) { nextLook = now + 900 + Math.random() * 2200;
        lookTo = state === 'think' ? [-5, -4] : state === 'listen' ? [Math.random() * 2 - 1, 1] : [Math.random() * 6 - 3, Math.random() * 3 - 1.5]; }
      look[0] += (lookTo[0] - look[0]) * 0.18; look[1] += (lookTo[1] - look[1]) * 0.18;
      for (const s of ['L', 'R']) { const tr = `translate(${look[0] / 10.24 * 0.6}%, ${look[1] / 10.24 * 0.6}%)`;
        el['iris' + s].style.transform = `translate(${look[0] * 0.09}vmin,0)`; el['iris' + s].style.translate = `${look[0]}px ${look[1]}px`;
        el['iris' + s].style.transform = ''; el['catch' + s].style.translate = `${look[0]}px ${look[1]}px`; void tr; }
      // brows
      const browTo = state === 'listen' ? -6 : state === 'think' ? -3 : state === 'speak' ? -2 * (Math.sin(t * 2.1) > 0.7 ? 1 : 0) : 0;
      brow += (browTo - brow) * 0.12;
      el.browL.style.translate = `0 ${brow * 0.35}px`; el.browR.style.translate = `0 ${brow * 0.35 + (state === 'think' ? -1 : 0)}px`;
      // jaw: syllable envelope ~4.6 Hz with phrase gaps
      let jt = 0;
      if (state === 'speak') { const syl = Math.max(0, Math.sin(t * 2 * Math.PI * 4.6)) ** 1.5; const phrase = Math.sin(t * 2 * Math.PI * 0.55) > -0.75 ? 1 : 0.1;
        jt = syl * phrase * (0.55 + 0.45 * Math.sin(t * 7.3) ** 2); }
      jaw += (jt - jaw) * 0.45;
      el.mouth.lo.style.translate = `0 ${jaw * 9}%`; el.mouth.cav.style.transform = `scaleY(${0.2 + jaw * 5.5})`; el.mouth.cav.style.opacity = jaw > 0.04 ? 1 : 0;
      // head and breath
      if (!reduce) {
        const sway = Math.sin(t * 0.7) * 0.6 + (state === 'speak' ? Math.sin(t * 1.9) * 0.5 : 0) + (state === 'listen' ? 1.2 : 0);
        const nod = (state === 'speak' ? Math.sin(t * 2.3) * 0.25 : 0) + (state === 'listen' ? 0.35 : 0);
        head.style.transform = `rotate(${sway}deg) translateY(${nod}%)`;
        el.body.style.transform = `scaleY(${1 + Math.sin(t * 1.6) * 0.004})`;
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    setState(state);
    return { setState, get state() { return state; }, destroy() { alive = false; cancelAnimationFrame(raf); rig.remove(); } };
  }
  window.Asha = { mount };
})();
