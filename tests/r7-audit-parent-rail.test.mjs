// r7 audit LEARN-35: at 900 px and wider the rail replaces the bottom tabs and the More page, but it had no Teaching and no
// Sign out, so a parent on a laptop could not reach either. Every section the More page lists must be in the rail, and the
// rail signs out. Source check (the shell imports styles and React, not loadable in node --test).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const shell = readFileSync(new URL("../src/parent/Shell.tsx", import.meta.url), "utf8");
const pages = readFileSync(new URL("../src/parent/Pages.tsx", import.meta.url), "utf8");

test("every parent section on the More page is in the rail", () => {
  const more = pages.slice(pages.indexOf('title="More"'), pages.indexOf("</ParentShell>", pages.indexOf('title="More"')));
  const sections = [...more.matchAll(/to=\{`\/parent\/([a-z]+)\$\{qs\}`\}/g)].map((m) => m[1]).filter((s) => s !== "pin");
  assert.ok(sections.includes("teaching"));
  const rail = [...shell.matchAll(/to: \(c\) => `\/parent\/([a-z]+)\$\{q\(c\)\}`/g)].map((m) => m[1]);
  for (const s of sections) assert.ok(rail.includes(s), `${s} is on More but not in the rail`);
});

test("the rail has Sign out", () => {
  const rail = shell.slice(shell.indexOf('<aside className="pa-rail"'), shell.indexOf("</aside>", shell.indexOf('<aside className="pa-rail"')));
  assert.match(rail, /signOut\(nav\)/);
  assert.match(rail, /Sign out/);
});
