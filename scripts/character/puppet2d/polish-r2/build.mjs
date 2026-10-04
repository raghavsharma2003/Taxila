// Bundle the arm-P demo (runtime + the real src/avatar lip/behaviour/compositor) into art/character/puppet2d/polish-r2/.
//   node scripts/character/puppet2d/polish-r2/build.mjs
import { build } from "vite";
await build({
  configFile: false,
  logLevel: "warn",
  publicDir: false,
  build: {
    outDir: "art/character/puppet2d/polish-r2",
    emptyOutDir: false,
    minify: true,
    lib: { entry: "scripts/character/puppet2d/polish-r2/runtime/demo.js", formats: ["es"], fileName: () => "demo.bundle.js" },
  },
});
console.log("built art/character/puppet2d/polish-r2/demo.bundle.js");
