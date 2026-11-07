const SP = "/tmp/claude-0/-home-user-Taxila/efd71bc1-a51b-55f0-8b66-400684e849f8/scratchpad";
const OLD = (await import(SP + "/pb/server/content/curriculum.js")).findTopic, NEW = (await import("/home/user/Taxila/server/content/curriculum.js")).findTopic;
const { getTopic } = await import("/home/user/Taxila/server/content/curriculum.js");
const PROBES = ["geometry", "shapes", "triangles", "त्रिभुज", "आकार", "algebra", "measurement", "time", "money", "multiplication", "guna", "division", "addition", "subtraction", "graphs", "data",
  "maps", "decimals", "fractions", "numbers", "plants", "paudhe", "animals", "body", "space", "planets", "water", "food", "electricity", "magnets", "light", "sound", "weather", "history", "photosynthesis", "symmetry"];
let oldHit = 0, newHit = 0, n = 0; const gained = [];
for (const w of PROBES) for (let c = 1; c <= 9; c++) { n++; const a = OLD(w, c), b = NEW(w, c); if (a) oldHit++; if (b) newHit++; if (b && !a) gained.push(`c${c} ${w} → ${b.title}`); if (a && b && a.id !== b.id) gained.push(`CHANGED c${c} ${w}: ${a.title} → ${b.title}`); }
console.log(n, "(subject word, class) probes;", oldHit, "found a real chapter before,", newHit, "after;", n - newHit, "still none (now: she will look for it + real topics as buttons)");
for (const g of gained) console.log("  ", g);
