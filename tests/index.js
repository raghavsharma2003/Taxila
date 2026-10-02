// Entry for `npm test` (= `node --test tests/`). Node 22's runner treats a directory argument as a single
// module path, not a folder to search, so it lands here: import every *.test.mjs next to this file and
// node:test runs them in this process. A glob script (`node --test "tests/*.test.mjs"`) skips this file.
import { readdirSync } from "fs";

const dir = new URL("./", import.meta.url);
for (const f of readdirSync(dir).filter((n) => n.endsWith(".test.mjs")).sort()) await import(new URL(f, dir).href);
