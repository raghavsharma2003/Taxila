p = 'tests/p3-voicesig-client.test.mjs'
s = open(p).read()
old = """  // a session that never answers within the budget
  const slow = { session: { run: () => new Promise((r) => setTimeout(() => r({ p: { data: new Float32Array(0) } }), 400)) }, ort: { Tensor: class { constructor() {} } }, thr: 0.44, ver: "slow" };
  const { rt, a, link, vf } = await lesson({ acquire, loadDetector: async () => slow });
  await flush();
  const t0 = Date.now() - 6000;
  const sentAt = Date.now();
  speak(link, stats.fe, t0);
  await flush(); await flush();
  assert.ok(Date.now() - sentAt < 200, "the request went out without waiting");
  assert.equal(a.calls.turn[0].voiceFeatures.kv.q.det, 0);"""
new = """  // a session that has NOT answered until the test releases it: the property is ORDER, not wall time (14.4, stream 3). The
  // old bound (< 200 ms from before speak()) timed the harness: speak() synthesises and pushes ~6 s of frames, 169-252 ms
  // on a loaded 4-core container (it failed 1 in 3 alone), while the child's final -> the turn request took 2-4 ms.
  let pending = 0;
  const releases = [];
  const slow = { session: { run: () => { pending++; return new Promise((r) => releases.push(() => { pending--; r({ p: { data: new Float32Array(0) } }); })); } },
    ort: { Tensor: class { constructor() {} } }, thr: 0.44, ver: "slow" };
  const { rt, a, link, vf } = await lesson({ acquire, loadDetector: async () => slow });
  await flush();
  const t0 = Date.now() - 6000;
  speak(link, stats.fe, t0);
  await flush(); await flush();
  assert.equal(a.calls.turn.length, 1, "the turn request went out");
  assert.ok(pending > 0, "while the detector had still not answered: the request never waits on it");
  assert.equal(a.calls.turn[0].voiceFeatures.kv.q.det, 0);
  for (const r of releases.splice(0)) r();"""
assert old in s
s = s.replace(old, new, 1)
open(p, 'w').write(s)
print("ok")
