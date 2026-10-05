// VALUES-100 V3 extension archetypes: the contract tests. Run: npx tsx --test evals/studio-catalogue/ext.test.mjs
// (wired into `npm test` by docs/design/values/v3/patches/02-npm-test.patch).
//   1. the client engine registry and the spec registry list the same archetypes
//   2. every default spec validates with ZERO repairs (a default that needs repair is a latent fallback)
//   3. 300 seeded mutations per archetype: validate never throws and its output always passes the strict schema
//   4. grade never throws on junk acts and never says "right" to an empty act
//   5. every misconception id and kit item id a default (or catalogue spec) cites exists in data/kits
//   6. the child-safety floor: c7-science-ch06-* is stripped from skills (and the catalogue has no game for it)
//   7. every catalogue spec in data/studio-catalogue/topics validates without falling back
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ENGINE_SPECS_EXT, validateAny, gradeAny, SAFETY_EXCLUDED } from "../../shared/studio-spec-ext/index.ts";
import { ENGINE_SPECS } from "../../shared/studio-spec.ts";

const ROOT = path.resolve(new URL("../..", import.meta.url).pathname);
const ARCH = Object.keys(ENGINE_SPECS_EXT);

// kit ids
const kitIds = new Set();
for (const f of fs.readdirSync(path.join(ROOT, "data/kits"))) {
  if (!/^c[4-7]-.*\.json$/.test(f)) continue;
  const k = JSON.parse(fs.readFileSync(path.join(ROOT, "data/kits", f), "utf8"));
  for (const t of k.topics ?? []) { kitIds.add(t.topicId); for (const m of t.misconceptions ?? []) kitIds.add(m.id); for (const i of t.items ?? []) kitIds.add(i.id); }
}
function citedIds(spec) { const out = []; JSON.stringify(spec, (k, v) => { if ((k === "targets" || k === "src") && typeof v === "string") out.push(v); return v; }); return out; }

test("client and spec registries list the same archetypes", () => {
  const dir = path.join(ROOT, "src/studio-v2/engines/ext");
  const idx = fs.readFileSync(path.join(dir, "index.ts"), "utf8");
  const listed = [...idx.matchAll(/import \{ (\w+) \} from "\.\/(\w+)\.ts";/g)].map((m) => m[2]);
  const client = listed.map((f) => { const src = fs.readFileSync(path.join(dir, f + ".ts"), "utf8"); const m = /archetype: "([a-z-]+@\d+)", label:/.exec(src); return m?.[1]; }).filter(Boolean);
  assert.deepEqual([...new Set(client)].sort(), [...ARCH].sort());
  for (const a of ARCH) assert.ok(!(a in ENGINE_SPECS), `${a} collides with a base archetype`);
});

for (const a of ARCH) {
  const d = ENGINE_SPECS_EXT[a];
  test(`${a}: default validates with zero repairs`, () => {
    const v = validateAny(a, structuredClone(d.defaultSpec));
    assert.equal(v.fellBack, false, `fell back: ${v.repairs.join("; ")}`);
    assert.deepEqual(v.repairs, []);
  });
  test(`${a}: default cites only real kit ids`, () => { for (const id of citedIds(d.defaultSpec)) assert.ok(kitIds.has(id), `${a} cites unknown id ${id}`); });
  test(`${a}: 300 mutations never throw and always pass the strict schema`, () => {
    let s = 7 + a.length; const rnd = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
    const junk = () => [null, undefined, 0, -1, 1e9, NaN, "", "x".repeat(400), "<script>", [], {}, [1, 2], { a: 1 }, true, "c7-science-ch06-t01"][Math.floor(rnd() * 15)];
    function mutate(o, depth = 0) {
      if (Array.isArray(o)) { const c = o.map((x) => (rnd() < 0.15 ? junk() : mutate(x, depth + 1))); if (rnd() < 0.1) c.push(junk()); if (rnd() < 0.1) c.splice(0, 1); return c; }
      if (o && typeof o === "object") { const c = {}; for (const [k, v] of Object.entries(o)) { if (rnd() < 0.06) continue; c[k] = rnd() < 0.12 ? junk() : mutate(v, depth + 1); } if (rnd() < 0.05) c.extra = junk(); return c; }
      if (typeof o === "number") return rnd() < 0.2 ? o * (rnd() * 40 - 20) : o;
      if (typeof o === "string") return rnd() < 0.15 ? o + "{x}" : o;
      return o;
    }
    for (let i = 0; i < 300; i++) {
      const raw = i % 50 === 0 ? junk() : mutate(structuredClone(d.defaultSpec));
      let v; assert.doesNotThrow(() => { v = validateAny(a, raw); }, `mutation ${i} threw`);
      const p = d.schema.safeParse(v.spec); assert.ok(p.success, `mutation ${i}: output fails the schema (${p.success ? "" : p.error.issues.slice(0, 2).map((x) => x.path.join(".")).join("|")})`);
      assert.ok(!v.spec.skills.some((x) => SAFETY_EXCLUDED.test(x)), "excluded topic survived");
    }
  });
  test(`${a}: grade never throws on junk and an empty act is never right`, () => {
    const spec = d.defaultSpec, items = (d.keys?.(spec) ?? []).map((k) => k.itemId);
    for (const id of [...items, "r1", "r1:0", "zz", "", "r99"]) for (const v of [undefined, null, {}, [], "x", 0, { a: NaN }, [[1, 2]], { moves: "x" }]) {
      let g; assert.doesNotThrow(() => { g = gradeAny(a, spec, id, v); }, `${id} threw`);
      if (v === undefined || v === null || (typeof v === "object" && !Array.isArray(v) && !Object.keys(v).length)) assert.notEqual(g.verdict, "right", `${a} ${id} graded an empty act right`);
    }
  });
}

test("child-safety floor: the Adolescence chapter is stripped from every archetype's skills", () => {
  for (const a of ARCH) {
    const raw = { ...structuredClone(ENGINE_SPECS_EXT[a].defaultSpec), skills: ["c7-science-ch06-t01", "c7-science-ch06-t02"] };
    const v = validateAny(a, raw);
    assert.ok(!v.spec.skills.some((x) => SAFETY_EXCLUDED.test(x)), a);
    assert.ok(v.repairs.includes("safety:excluded-topic"), `${a} did not record the safety repair`);
  }
});

const CAT = path.join(ROOT, "data/studio-catalogue/topics");
test("catalogue: every authored spec validates without falling back, cites real ids, and excluded topics carry no game", { skip: !fs.existsSync(CAT) }, () => {
  let n = 0;
  for (const f of fs.readdirSync(CAT)) {
    const r = JSON.parse(fs.readFileSync(path.join(CAT, f), "utf8"));
    if (SAFETY_EXCLUDED.test(r.topicId)) { assert.ok(!r.game?.spec && !r.explainer?.spec, `${r.topicId} has generated content`); continue; }
    for (const part of ["game", "explainer"]) {
      const p = r[part]; if (!p?.spec) continue; n++;
      const v = validateAny(p.archetype, p.spec);
      assert.equal(v.fellBack, false, `${r.topicId} ${part} falls back`);
      for (const id of citedIds(p.spec)) assert.ok(kitIds.has(id), `${r.topicId} ${part} cites unknown id ${id}`);
    }
  }
  assert.ok(n > 0);
});
