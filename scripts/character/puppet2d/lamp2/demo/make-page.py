"""demo/page.html = lamp1's demo page (same scene, slots, timeline, capture API) with the rig swapped by pack:
a lamp2 pack gets the KeyRig, any other pack (the r8 calibration) the shipped r8 runtime.
    python3 -I demo/make-page.py"""
s = open('/home/user/Taxila/scripts/character/puppet2d/lamp1/demo/page.html').read()
R = [
('<title>Asha Live Puppet</title>', '<title>Asha Painted Keys</title>'),
('<h1>Asha, live puppet (lamp1)</h1>', '<h1>Asha, painted keys (lamp2)</h1>'),
('''<p>Painted layers cut from her approved front (the r8 arm-P method): a membrane fill under every moving part, the lip shell and the Hindi / Hinglish mouth set, lid keys for blinks, a turn of up to 20 degrees from painted three-quarter keys with flat violet shadow planes, breathing, and spring motion on the two loose locks.</p>''', '''<p>Painted keys of her approved front, swapped, never stretched: ten painted mouths timed from Diya's visemes (60 ms crossfades), painted eye keys for blinks and glances, painted brows, and only small rigid motion of the head (within 2 degrees) and a sub-pixel breath.</p>'''),
('''      const rig = new T.Puppet2DRig(cv, P.geom, null, imgs, { ext: "webp", view, preserve: CAPTURE, reducedMotion: $("#reduced").checked,
        dpr: CAPTURE ? Number(Q.get("dpr") || 2) : Math.min(2, devicePixelRatio || 1) });''', '''      const dprV = CAPTURE ? Number(Q.get("dpr") || 2) : Math.min(2, devicePixelRatio || 1);
      const rig = P.geom.rev === "lamp2"
        ? new T.KeyRig(cv, P.geom, imgs, { view, reducedMotion: $("#reduced").checked, dpr: dprV })
        : new T.Puppet2DRig(cv, P.geom, null, imgs, { ext: "webp", view, preserve: CAPTURE, reducedMotion: $("#reduced").checked, dpr: dprV });'''),
('''      LOG.push({ st: +st.toFixed(4), state: f.state, lip: f.lipSource, gap: r0.mouth && r0.mouth.p ? +(+r0.mouth.p.g).toFixed(2) : null,
        blinkL: r0.eyes ? +(+r0.eyes.L.blink).toFixed(3) : null,''', '''      LOG.push({ st: +st.toFixed(4), state: f.state, lip: f.lipSource, gap: r0.mouth && r0.mouth.p ? +(+r0.mouth.p.g).toFixed(2) : null,
        mouth: r0.mouthShown ? [r0.mouthShown.a, r0.mouthShown.b, +r0.mouthShown.k.toFixed(3)] : (r0.mouth ? r0.mouth.name : null),
        eyes: r0.eyesShown ? [r0.eyesShown.a, r0.eyesShown.b, +r0.eyesShown.k.toFixed(3)] : null,
        brows: r0.browsShown ? [r0.browsShown.a, r0.browsShown.b, +r0.browsShown.k.toFixed(3)] : null,
        pose: r0.pose ? [+r0.pose.rot.toFixed(3), +r0.pose.sway.toFixed(3), +r0.pose.nod.toFixed(3)] : null,
        brow: [+(f.mouth.browInnerUp || 0).toFixed(2), +(((f.mouth.browOuterUpLeft || 0) + (f.mouth.browOuterUpRight || 0)) / 2).toFixed(2)],
        blinkL: r0.eyes ? +(+r0.eyes.L.blink).toFixed(3) : null,'''),
('for (const r of rigs) r.R.gl.finish(); return this.st;', 'for (const r of rigs) if (r.R.gl) r.R.gl.finish(); return this.st;'),
('fan = { clock: null, frame(bs, head, gaze, lean, breath) { for (const r of rigs) { r.clock = this.clock; r.frame(bs, head, gaze, lean, breath); } } };',
 'fan = { clock: null, frame(bs, head, gaze, lean, breath) { for (const r of rigs) { r.clock = this.clock; r.calm = driver.inSafety; r.frame(bs, head, gaze, lean, breath); } } };'),
]
for a, b in R:
    assert a in s, a[:60]
    s = s.replace(a, b)
open('/home/user/Taxila/scripts/character/puppet2d/lamp2/demo/page.html', 'w').write(s)
