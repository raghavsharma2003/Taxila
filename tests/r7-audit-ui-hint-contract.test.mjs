// r7 audit TEACHER-04: ui.hint is produced (director/state.js hintFor) and read (src/child/lesson/useDesk.ts), so the
// contract between them names it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("UiDirectives declares hint { level, text }", () => {
  const src = readFileSync(new URL("../shared/contracts.ts", import.meta.url), "utf8");
  const ui = src.slice(src.indexOf("export interface UiDirectives"), src.indexOf("\n}\n", src.indexOf("export interface UiDirectives")));
  assert.match(ui, /\n\s*hint\?:\s*\{\s*level:\s*1 \| 2 \| 3;\s*text:\s*string\s*\}/);
});
