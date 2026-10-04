// Bundle the arm-P demo (runtime + the real src/avatar lip/behaviour/compositor) into art/character/puppet2d/polish-r3/.
//   node scripts/character/puppet2d/polish-r3/build.mjs
import { build } from "vite";
import { execSync } from "node:child_process";
execSync("python3 scripts/character/puppet2d/polish-r3/pack.py", { stdio: "inherit" });
await build({
  configFile: false,
  logLevel: "warn",
  publicDir: false,
  build: {
    outDir: "art/character/puppet2d/polish-r3",
    emptyOutDir: false,
    minify: !process.env.NOMIN,
    lib: { entry: "scripts/character/puppet2d/polish-r3/runtime/demo.js", formats: ["es"], fileName: () => "demo.bundle.js" },
  },
});
console.log("built art/character/puppet2d/polish-r3/demo.bundle.js");
