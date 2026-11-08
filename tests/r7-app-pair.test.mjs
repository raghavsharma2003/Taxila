// r7 stream E app-child-device-pairing (main 2026-11-08): the child's own phone or tablet joins with a one-time code the
// parent makes in the corner. Client side against Platform's routes (stubs until they land): the code's alphabet and
// shape, the /pair page, the corner's card, the child-scoped session in the shell, and the corner kept behind the
// grown-up's own sign-in on a paired device.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const P = await import("../src/app/pair.ts");
const { ApiError } = await import("../src/lesson/api.ts");

test("the code: 6 characters, no 0/O/1/I, typed any way", () => {
  assert.equal(P.PAIR_ALPHABET.length, 32);
  for (const c of "0O1I") assert.ok(!P.PAIR_ALPHABET.includes(c), c);
  assert.equal(P.cleanPairCode("k7p 3qx"), "K7P3QX");
  assert.equal(P.cleanPairCode("K7P-3QX-ZZ"), "K7P3QX");
  assert.equal(P.cleanPairCode("o0I1k7"), "K7", "read-alikes never appear in a code, so they are dropped");
  assert.ok(P.isPairCode("K7P3QX"));
  assert.ok(!P.isPairCode("K7P3Q"));
  assert.ok(!P.isPairCode("K7P3Q0"));
  assert.equal(P.showPairCode("K7P3QX"), "K7P 3QX");
  assert.equal(P.pairLink("https://taxila.dev/", "K7P3QX"), "https://taxila.dev/pair?code=K7P3QX");
  assert.equal(P.secondsLeft(new Date(10_000 + 61_500).toISOString(), 10_000), 62);
  assert.equal(P.secondsLeft("2020-01-01T00:00:00Z", Date.now()), 0);
  assert.equal(P.secondsLeft("nope", Date.now()), 0);
});

test("the routes the client calls are main's shape for Platform", () => {
  const src = read("src/app/pair.ts");
  assert.match(src, /postJson<\{ code: string; expiresAt: string \}>\("\/api\/pair\/code", \{ childId \}\)/);
  assert.match(src, /postJson<\{ childId: string; name\?: string \}>\("\/api\/pair\/redeem", \{ code \}\)/);
  assert.match(src, /getJson<\{ devices: PairedDevice\[\] \}>\(`\/api\/pair\/devices\?childId=/);
  assert.match(src, /request<\{ ok: boolean \}>\("DELETE", `\/api\/pair\/devices\/\$\{encodeURIComponent\(id\)\}`/);
});

test("a wrong code says only that it did not work (never which children exist)", () => {
  for (const s of [400, 404, 410]) assert.match(P.redeemErrorOf(new ApiError(s, "x", {})), /^That code did not work/);
  assert.match(P.redeemErrorOf(new ApiError(429, "x", {})), /Too many tries/);
  assert.match(P.redeemErrorOf(new Error("x"), false), /offline/);
});

test("/pair redeems, refreshes who is signed in and opens the child's app; a QR link's code goes on by itself", () => {
  const r = read("src/app/routes.tsx");
  assert.match(r, /\{ path: "\/pair", element: s\(<Pair \/>\) \}/);
  const p = read("src/app/Pair.tsx");
  assert.match(p, /const r = await pairApi\.redeem\(code\);\s*await refreshMe\(\);\s*nav\(`\/c\/\$\{encodeURIComponent\(r\.childId\)\}`, \{ replace: true \}\);/);
  assert.match(p, /if \(!auto\.current && isPairCode\(code\) && sp\.get\("code"\)\)/);
});

test("a child-scoped session: Who opens its one child, the corner asks for the grown-up's own sign-in, sign-in is offered over it", () => {
  assert.match(read("src/app/api.ts"), /scope\?: "parent" \| "child";/);
  assert.match(read("src/app/Who.tsx"), /if \(me\.scope === "child" && me\.children\[0\]\) return nav\(`\/c\/\$\{me\.children\[0\]\.id\}`, \{ replace: true \}\);/);
  assert.match(read("src/app/routes.tsx"), /\{ path: "\/parent\/\*", element: s\(<ParentOnly><ParentCorner \/><\/ParentOnly>\) \}/);
  const g = read("src/app/ParentOnly.tsx");
  assert.match(g, /if \(me\?\.scope !== "child"\) return <>\{children\}<\/>;/);
  assert.match(g, /to="\/start\/phone\?login=1&next=\/parent"/);
  assert.match(read("src/onboarding/Account.tsx"), /loadMe\(\)\.then\(\(m\) => setMe\(m\?\.guardian \? m : null\)/);
});

test("the corner's card: one per child on Children; a new code, a QR, a countdown; unpair asks once", () => {
  assert.match(read("src/parent/Pages.tsx"), /<PairCard childId=\{k\.id\} name=\{k\.first_name\} \/>/);
  const c = read("src/app/PairCard.tsx");
  assert.match(c, /`Put Taxila on \$\{name\}'s device`/);
  assert.match(c, /import\("qrcode-generator"\)/, "the QR library loads only when a code is shown");
  assert.match(c, /pairLink\(origin, code\.code\)/);
  assert.match(c, /data-testid="pair-unpair-yes"/);
  assert.doesNotMatch(c, /\b(behind|ahead|level)\b/i);
});
