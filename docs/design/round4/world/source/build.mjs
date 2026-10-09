// Assemble docs/design/round4/world/index.html: <title> + <style> first (no doctype/html/head/body; a skeleton is added at publish).
import { readFileSync, writeFileSync, statSync } from "node:fs";
const W = new URL(".", import.meta.url).pathname;
const r = (p) => readFileSync(W + p, "utf8");
const css = r("src/style.css");
const js = ["src/core.js", "src/scenes.js", "src/curr.js", "src/screens1.js", "src/lesson.js", "src/game.js", "src/map.js", "src/parent.js", "src/main.js"].map(r).join("\n");
const out = `<title>Taxila — Prakash (game-native world)</title>
<style>
${css}
</style>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#120F24">
<script>
/* The teacher's face: src/face-puppet (polish r8 rig + PuppetDriver), bundled byte-for-byte from the Taxila repo with rolldown. */
${r("build/puppet.js")}
</script>
<script>
${r("build/pack.js")}
</script>
<script>
(function(){
${js}
})();
</script>
`;
const dest = process.argv[2] || "/home/user/Taxila/docs/design/round4/world/index.html";
writeFileSync(dest, out);
console.log(dest, (statSync(dest).size / 1024).toFixed(0) + " KB");
