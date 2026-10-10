/* U1 prototype runtime shared by the three directions: language, screens + transitions, captions in time with
   Asha's mouth, cancellable flows, procedural sound, and the hooks the shoot/lint harness uses (window.__u). */
(function () {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const S = {};
  const U = {
    lang: 'hing', screen: null, reduced, tok: 0, on: {}, asha: [],
    add(dict) { Object.assign(S, dict); },
    t(k, l) { const e = S[k]; if (!e) return k; return e[l || U.lang] ?? e.hing ?? e.en; },
    setLang(l) {
      U.lang = l;
      document.documentElement.lang = l === 'hi' ? 'hi' : 'en-IN';
      document.body.dataset.lang = l;
      document.querySelectorAll('[data-t]').forEach((n) => { n.innerHTML = U.t(n.dataset.t); });
      document.querySelectorAll('[data-t-aria]').forEach((n) => n.setAttribute('aria-label', U.t(n.dataset.tAria)));
      document.querySelectorAll('[data-lang-btn]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.langBtn === l)));
      U.on.lang?.(l);
    },
    $(s, r = document) { return r.querySelector(s); },
    $$(s, r = document) { return [...r.querySelectorAll(s)]; },
    alive(tok) { return tok === U.tok; },
    wait(ms, tok) { return new Promise((res, rej) => setTimeout(() => (tok === undefined || tok === U.tok ? res() : rej(new Error('stale'))), U.fast ? 0 : ms)); },
    async go(name, opt = {}) {
      if (name === U.screen && !opt.force) return;
      const from = U.screen; U.tok++;
      const tok = U.tok;
      const swap = () => {
        U.$$('[data-screen]').forEach((s) => { const on = s.dataset.screen === name; s.hidden = !on; s.classList.toggle('is-on', on); });
        document.body.dataset.screen = name; document.body.dataset.from = from || '';
        U.screen = name;
        const sc = U.$(`[data-screen="${name}"]`); sc?.scrollTo?.(0, 0); window.scrollTo(0, 0);
      };
      U.on.leave?.(from, name);
      document.documentElement.dataset.dir = opt.dir || 'fwd';
      if (document.startViewTransition && !reduced && !U.fast && from) {
        const vt = document.startViewTransition(swap);
        await vt.updateCallbackDone;
      } else swap();
      U.sfx(opt.sound || 'whoosh');
      try { await U.on[name]?.(tok, opt); } catch (e) { if (e.message !== 'stale') console.error(e); }
    },
    /* Reveal a caption word by word while Asha's mouth moves. Speed is about 2.7 words a second (a calm teacher). */
    async say(el, key, tok, opt = {}) {
      const text = opt.raw || U.t(key);
      el.dataset.key = key || '';
      const words = text.split(/\s+/);
      el.innerHTML = words.map((w) => `<span class="w">${w}</span>`).join(' ');
      el.classList.add('saying');
      const per = opt.per || 360;
      U.asha.forEach((a) => a.setState('speak', words.length * per + 300));
      const spans = [...el.children];
      for (let i = 0; i < spans.length; i++) {
        spans[i].classList.add('on');
        await U.wait(per, tok);
      }
      el.classList.remove('saying');
      await U.wait(opt.after ?? 250, tok);
      return true;
    },
    /* Quiet procedural sounds (WebAudio). The world's sound is short and success-proportional; nothing plays under her voice. */
    ctx: null, muted: false,
    sfx(name) {
      if (U.muted || U.fast) return;
      try {
        U.ctx ||= new (window.AudioContext || window.webkitAudioContext)();
        const c = U.ctx, t = c.currentTime, g = c.createGain(); g.connect(c.destination);
        const tone = (f, d, type = 'sine', v = 0.05, at = 0) => { const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t + at);
          const gg = c.createGain(); gg.gain.setValueAtTime(0, t + at); gg.gain.linearRampToValueAtTime(v, t + at + 0.01); gg.gain.exponentialRampToValueAtTime(0.0001, t + at + d);
          o.connect(gg); gg.connect(g); o.start(t + at); o.stop(t + at + d + 0.02); return o; };
        if (name === 'tap') tone(660, 0.07, 'triangle', 0.04);
        else if (name === 'whoosh') { const o = tone(220, 0.28, 'sine', 0.025); o.frequency.exponentialRampToValueAtTime(520, t + 0.25); }
        else if (name === 'ok') { tone(523, 0.16, 'triangle', 0.05); tone(784, 0.22, 'triangle', 0.04, 0.08); }
        else if (name === 'soft') tone(330, 0.12, 'sine', 0.04);
        else if (name === 'launch') { const o = tone(90, 1.1, 'sawtooth', 0.03); o.frequency.exponentialRampToValueAtTime(880, t + 1.0); }
        else if (name === 'chime') [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.5, 'sine', 0.035, i * 0.09));
      } catch (e) { /* audio is optional */ }
    },
    /* A believable mic level for the duplex listening meter. */
    level(t) { return Math.max(0, Math.sin(t * 9.1) * 0.35 + Math.sin(t * 3.7) * 0.4 + Math.sin(t * 17.3) * 0.15 + 0.15); },
    mountAsha(el, opt) { if (!el || el.dataset.mounted) return; el.dataset.mounted = '1'; const a = window.Asha.mount(el, opt); U.asha.push(a); return a; },
    ashaState(s) { U.asha.forEach((a) => a.setState(s)); },
    count(el, to, ms = 900) { const t0 = performance.now(); const from = +el.textContent || 0;
      const f = (n) => { const k = Math.min(1, (n - t0) / ms); el.textContent = Math.round(from + (to - from) * (1 - (1 - k) ** 3)); if (k < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); },
  };
  window.U = U;
  // Harness hooks: __u.go('lesson',{at:'check'}) jumps to a state, fast mode skips waits.
  window.__u = { go: (s, o) => U.go(s, { ...(o || {}), force: true }), lang: (l) => U.setLang(l), fast: (v) => { U.fast = v; }, U };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-go]'); if (b) { e.preventDefault(); U.sfx('tap'); U.go(b.dataset.go, { dir: b.dataset.dir, from: 'click' }); }
    const l = e.target.closest('[data-lang-btn]'); if (l) { U.sfx('tap'); U.setLang(l.dataset.langBtn); }
  });
  window.addEventListener('DOMContentLoaded', () => {
    const h = new URLSearchParams(location.hash.slice(1));
    U.setLang(h.get('lang') || 'hing');
    if (h.get('mute')) U.muted = true;
    U.on.init?.();
    U.go(h.get('s') || 'open', { at: h.get('at'), force: true });
  });
})();
