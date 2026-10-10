// r4-latency: run against a tests/prod/r4-timeline driver session (node evals/latency/longtask-probe.mjs <sid>).
// one tap-to-talk lesson: per turn, the long tasks (>= 50 ms main-thread blocks) inside final -> turn POST
const sid = process.argv[2] || "lt1";
const cmd = async (c) => (await fetch("http://127.0.0.1:5199/", { method: "POST", body: JSON.stringify(c) })).json();
const lines = ["Mujhe batting pasand hai.", "Haan, samajh gaya.", "Do bata teen.", "Mujhe nahi pata, ek baar aur batao na.", "Teen bata chaar.", "Half ka half ek chauthai hota hai.", "Haan didi.", "Chhe bata baarah.", "Mujhe lagta hai answer ek bata do hai.", "Achha, aage batao.", "Paanch bata aath.", "Kyunki maine multiply kiya."];
await cmd({ op: "eval", sid, js: "window.__lt=[];new PerformanceObserver(l=>{for(const e of l.getEntries())window.__lt.push([e.startTime,e.duration])}).observe({type:'longtask',buffered:true});true" });
for (const text of lines) {
  const r = await cmd({ op: "say", sid, text, doneAfterMs: 700 });
  const tl = await cmd({ op: "timeline", sid });
  const say = tl.says.at(-1);
  const turn = tl.net.filter((n) => /\/api\/lesson\/turn$/.test(n.path) && n.t0 >= say.t0).at(0);
  const lt = await cmd({ op: "eval", sid, js: "window.__lt" });
  const a = say.finalAt, b = turn?.t0;
  const inside = b ? lt.filter(([s, d]) => s < b && s + d > a) : [];
  const blocked = inside.reduce((x, [s, d]) => x + Math.min(b, s + d) - Math.max(a, s), 0);
  console.log(JSON.stringify({ text, gap: b ? Math.round(b - a) : null, longTasks: inside.map(([s, d]) => [Math.round(s - a), Math.round(d)]), blockedMs: Math.round(blocked), sound: r.tl?.endToReplySound }));
}
