// The demo bundle as the product will be after integrate/02 (the lamp1-derived runtime synced into
// src/face-puppet/runtime): every src/face-puppet import of ./runtime/* resolves to scripts/character/puppet2d/lamp1/runtime/*.
import path from "node:path";
const SRC_RT = "/home/user/Taxila/src/face-puppet/runtime/";
const LAMP_RT = "/home/user/Taxila/scripts/character/puppet2d/lamp1/runtime/";
export default {
  input: "/home/user/Taxila/scripts/character/puppet2d/lamp1/demo/entry.js",
  platform: "browser",
  output: { format: "iife", name: "TxPuppet", minify: true, file: process.env.OUT_FILE },
  plugins: [{
    name: "lamp1-runtime",
    resolveId(source, importer) {
      if (!importer || !source.startsWith(".")) return null;
      const abs = path.resolve(path.dirname(importer), source);
      return abs.startsWith(SRC_RT) ? LAMP_RT + abs.slice(SRC_RT.length) : null;
    },
  }],
};
