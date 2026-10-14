// Round 5, stream 3 (latency): the work a replica does ONCE, at boot, so no child's lesson start pays for it.
// Measured 2026-10-14 (evals/latency/start-profile.mjs + a CPU profile, US container, Neon TEST): the FIRST lesson start
// of a process wrote its response at 2.4 s but the bytes left at 4.05 s. Right after res.end(), Studio's lesson-start
// prefetch built the stagecraft admissibility table (server/stagecraft/lesson.js productionCatalog: every catalogue
// record zod-validated and scanned, synchronously) and held the event loop for ~1.6 s. Every later start: 0 ms.
//   warmSync()   the synchronous builds: run BEFORE the server listens (the replica takes no traffic until they are done)
//   warmAsync()  connections: the database pool and the chat endpoint's TLS; after listen, never awaited by a request;
//                then every teaching kit normalised ONE TOPIC PER EVENT-LOOP TURN (kits.js: ~3.4 ms a topic, ~830 topics).
//                Measured: the home's first GET /api/child/map normalised its class's kits synchronously (~0.9 s on the
//                loop, CPU profile), right beside the child's lesson start, which waited behind it.
// Every step is guarded: a failed warm costs the first request what it cost before, nothing more.
// TAXILA_BOOT_WARM=0 turns it off.

const on = () => process.env.TAXILA_BOOT_WARM !== "0";

/** @returns {Promise<Record<string, number|string>>} ms per step, for the startup log */
export async function warmSync() {
  const out = {};
  if (!on()) return out;
  const t = performance.now();
  try {
    const { productionCatalog, stagecraftMode } = await import("./stagecraft/lesson.js");
    if (stagecraftMode() !== "off") { productionCatalog(); out.stagecraftCatalog = Math.round(performance.now() - t); }
  } catch (e) { out.stagecraftCatalog = `failed: ${String(e?.message ?? e).slice(0, 80)}`; }
  return out;
}

/** @returns {Promise<Record<string, number|string>>} */
export async function warmAsync() {
  const out = {};
  if (!on()) return out;
  const step = async (name, fn) => {
    const t = performance.now();
    try { await fn(); out[name] = Math.round(performance.now() - t); } catch (e) { out[name] = `failed: ${String(e?.message ?? e).slice(0, 80)}`; }
  };
  await Promise.all([
    // the pool's first connection (TLS + auth) and the test-clock table every request reads once per process
    step("db", async () => { const { q } = await import("./db.js"); await q("select 1"); }),
    step("testClock", async () => { const { offsetForToken } = await import("./comprehension/testclock.js"); await offsetForToken("boot-warm"); }),
    // the chat endpoint's TLS session on the keep-alive dispatcher (a GET that spends no tokens)
    step("chatTls", async () => {
      const { endpoint } = await import("./azure.js");
      const ctl = AbortSignal.timeout(5000);
      await fetch(`${endpoint()}/models`, { signal: ctl }).then((r) => r.arrayBuffer()).catch(() => {});
    }),
  ]);
  await step("kits", () => warmKits());
  return out;
}

/** Every topic's kit, normalised once, yielding to the event loop between topics (a request never waits > one topic). */
export async function warmKits() {
  const [{ SUBJECT_ORDER, topicSequence, getTopic }, { kitFromFile }] = await Promise.all([import("./content/curriculum.js"), import("./content/kits.js")]);
  let n = 0;
  for (let cls = 1; cls <= 12; cls++) {
    for (const subject of SUBJECT_ORDER) {
      for (const id of topicSequence(cls, subject)) {
        try { const t = getTopic(id); if (t) { kitFromFile(t); n++; } } catch { /* a bad kit costs its first request, as before */ }
        await new Promise((r) => setImmediate(r));
      }
    }
  }
  return n;
}
