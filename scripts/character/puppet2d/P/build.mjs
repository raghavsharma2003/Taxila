// Bundle the arm-P demo (runtime + the real src/avatar lip/behaviour/compositor) into art/character/puppet2d/P/.
//   node scripts/character/puppet2d/P/build.mjs
import { build } from "vite";
await build({
  configFile: false,
  logLevel: "warn",
  build: {
    outDir: "art/character/puppet2d/P",
    emptyOutDir: false,
    minify: true,
    lib: { entry: "scripts/character/puppet2d/P/runtime/demo.js", formats: ["es"], fileName: () => "demo.bundle.js" },
  },
});
console.log("built art/character/puppet2d/P/demo.bundle.js");
