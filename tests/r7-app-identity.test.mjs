// r7 stream E 9-15 onboarding sweep (gap app-identity-avatars): the older family picks a line emblem, not a painted animal.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("the emblem set is drawn (no raster) and offered to the older family only; an animal a child picked still renders", () => {
  const p = read("src/child/pictos.tsx");
  assert.match(p, /export const avatarsFor = \(family: "young" \| "older"\): readonly string\[\] => \(family === "older" \? EMBLEMS : AVATARS\)/);
  assert.match(p, /if \(id && id\.startsWith\("em-"\)\) return <Emblem id=\{id\} size=\{size\} \/>;/);
  const ids = [...p.matchAll(/"(em-[a-z]+)"/g)].map((m) => m[1]);
  const set = new Set(ids);
  for (const id of set) assert.match(p, new RegExp(`"${id}": "M`), `${id} has a path`);
  assert.equal(set.size, 12);
  for (const f of ["src/child/screens/Hello.tsx", "src/child/screens/Me.tsx"]) assert.match(read(f), /avatarsFor\(family\)/, f);
});

test("Hello's compact face keeps her name and AI teacher whole", () => {
  assert.match(read("src/ui-v3/kaksha/kit.css"), /\.kx-hello-face \.kx-who \{ white-space: nowrap; \}/);
});
