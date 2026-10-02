// Entry for `npm test` (= `node --test tests/`). Node 22's runner treats a directory argument as a single
// module path, not a folder to search, so it lands here: import every *.test.mjs next to this file and
// node:test runs them in this process. A glob script (`node --test "tests/*.test.mjs"`) skips this file.
import { readdirSync } from "fs";

// node:test starts running a file's tests while later files are still being imported, so a test that stubs
// globalThis.fetch can be mid-run when a later file captures "the native fetch" at import. Stash the real one
// before any test file loads; DB suites pin Neon's HTTP calls to it.
globalThis.__taxilaNativeFetch ??= globalThis.fetch;

const dir = new URL("./", import.meta.url);
for (const f of readdirSync(dir).filter((n) => n.endsWith(".test.mjs")).sort()) await import(new URL(f, dir).href);
