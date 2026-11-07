// r7 stream E app-me-settings: Me's rows change the lesson; What {T} remembers with Forget (STUDENT-FLOW §11.4).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("Bigger text reaches the lesson: Desk type tokens ×1.18, the stage's --ks-k, and the solver's fontScale", () => {
  const css = read("src/child/child.css");
  assert.match(css, /\[data-comfort="large"\]\[data-band="b3"\] \.dk \{ --t-ask: 24px;/);
  assert.match(css, /\[data-comfort="large"\]\[data-band="b4"\] \.dk \{/);
  assert.match(css, /\[data-comfort="large"\] \.ks \{ --ks-k: 1\.18; \}/);
  // never a self-referencing token (a custom-property cycle drops the text to 16 px: the B2 bug)
  assert.doesNotMatch(css.slice(css.indexOf("r7 app-me-settings")), /--t-[a-z]+:\s*calc\(var\(--t-/);
  assert.match(read("src/ui-v3/kaksha/lesson/stage.css"), /\.ks-rail \.dk-ask \{ font-size: calc\(18px \* var\(--ks-k, 1\)\)/);
  assert.match(read("src/child/lesson/Desk.tsx"), /closest\('\[data-comfort="large"\]'\) \? 1\.18 : 1/);
});

test("What {T} remembers: the client reads the child route, shows nothing when it is absent, forgets one item", async () => {
  const real = globalThis.fetch;
  try {
    const { getChildMemory, forgetChildMemory } = await import("../src/child/api.ts");
    globalThis.fetch = async () => new Response("{}", { status: 404, headers: { "content-type": "application/json" } });
    assert.equal(await getChildMemory("c1"), null, "no route yet: the section is not shown");
    const body = { keeps: true, items: [{ id: "11", text: "I like bowling.", at: "2026-11-03T10:00:00Z" }] };
    let seen = null;
    globalThis.fetch = async (url, init) => { seen = { url: String(url), init }; return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } }); };
    assert.deepEqual(await getChildMemory("c1"), body);
    assert.match(seen.url, /^\/api\/child\/memory\?childId=c1$/);
    assert.equal(await forgetChildMemory("c1", "11"), true);
    assert.equal(seen.init.method, "DELETE");
    assert.deepEqual(JSON.parse(seen.init.body), { childId: "c1", id: "11" });
  } finally {
    globalThis.fetch = real;
  }
});

test("the Teacher screen shows the memory items with Forget this and the consent-off line; Me links to it", () => {
  assert.match(read("src/child/screens/Teacher.tsx"), /<Remembers cid=\{cid\} name=\{rec\.name\} \/>/);
  const t = read("src/child/screens/Remembers.tsx");
  for (const k of ["mem.title", "mem.from", "mem.forget", "mem.off"]) assert.ok(t.includes(`tr7("${k}"`), k);
  const en = read("src/copy/en.ts");
  assert.match(en, /"mem\.off": "\{T\} doesn't remember anything between days\. Your grown-up chose this\."/);
  assert.match(read("src/child/screens/Me.tsx"), /testid="me-remembers"/);
});

test("the child memory route patch for Brain applies to the tree", () => {
  // (A Brain, after applying it at 5aa89a15 with the note through the relational writer: once the routes are in the tree the
  // patch is landed, so only an unlanded patch must still apply)
  if (/"GET \/api\/child\/memory"/.test(read("server/relational/routes.js"))) return;
  execFileSync("git", ["apply", "--check", "docs/patches/to-brain/008-app-child-memory-route.patch"], { cwd: new URL("..", import.meta.url) });
});
