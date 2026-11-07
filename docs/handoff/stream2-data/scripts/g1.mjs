process.env.FORGE_FLAVOUR = "off"; process.env.FORGE_DB_CACHE = "off"; process.env.FORGE_BLOB = "off";
const { requestFill } = await import("/home/user/Taxila/server/forge/index.js");
const { getKit } = await import("/home/user/Taxila/server/content/index.js");
const kit = await getKit("c5-english-ch02-t01", { generate: false });
const learner = { child: { firstName: "Asha", classLevel: 5, languagePref: "hinglish", interests: [] }, recentWrong: [], activeMisconceptions: [], pKnown: {} };
for (const it of kit.items.slice(0, 4)) { const x = await requestFill({ kit, item: it, move: "practice", learner, needByMs: 10_000, noGapRow: true }); console.log(x.status, x.renderer, Object.keys(x).join(","), x.command ? JSON.stringify(x.command).slice(0, 200) : ""); }
