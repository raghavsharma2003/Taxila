import { supports } from "/tmp/claude-0/-home-user-Taxila/efd71bc1-a51b-55f0-8b66-400684e849f8/scratchpad/pa/server/grading/corroborate.js";
const forms = ["So dust, germs and insects (like mosquitoes) can't get in.", "so dust and mosquitoes can't get in", "taaki dhool aur machchhar na jaayein"];
for (const t of ["Taaki dhool aur machchar andar na jaayein. Aur kitanu bhi. Warna paani ganda ho jaata hai.", "Taaki dhool aur machchhar na jaayein", "taaki dhool aur machchar na jaayein"])
  for (const f of forms) console.log(JSON.stringify(t).slice(0, 40).padEnd(42), JSON.stringify(f).slice(0, 40).padEnd(42), JSON.stringify(supports(f, t, [], forms, "")));
