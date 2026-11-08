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
  assert.match(src, /request<\{ ok: boolean \}>\("DELETE", `\/api\/pair\/devices\?id=\$\{encodeURIComponent\(id\)\}`, \{ id \}\)/, "Platform's router has no /:id form");
});

test("a wrong code says only that it did not work (never which children exist)", () => {
  for (const s of [400, 404, 410]) assert.match(P.redeemErrorOf(new ApiError(s, "x", { code: "pair.invalid" })), /^That code did not work/);
  assert.match(P.redeemErrorOf(new ApiError(429, "x", { code: "pair.rate_limited" })), /Too many tries/);
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
  assert.match(g, /title="Ask your parent to sign in"/);
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

test("Platform's device boot: child mode from the readable tx_paired cookie and /api/child/boot, never /api/me", async () => {
  const D = await import("../src/app/device.ts");
  assert.equal(D.pairedChildId("tx_in=1; tx_paired=6fc3f68e-0000-4000-8000-000000000001; x=y"), "6fc3f68e-0000-4000-8000-000000000001");
  assert.equal(D.pairedChildId("tx_in=1"), null);
  assert.equal(D.pairedChildId("tx_paired=<script>"), null);
  assert.ok(D.isChildDeviceRefusal(new ApiError(403, "x", { code: "scope.child_device" })));
  assert.ok(!D.isChildDeviceRefusal(new ApiError(403, "x", { code: "pin" })));
  // the boot's me is the guardian's: on the device it is cut to the paired child, with no guardian and no siblings
  const bootMe = { guardian: { id: "g", email: "p@x.in", name: "P" }, children: [{ id: "c1", first_name: "Riya" }, { id: "c2", first_name: "Kabir" }], consents: [{ purpose: "memory" }], ui: { kaksha: true } };
  const m = D.childDeviceMeOf(bootMe, "c1");
  assert.equal(m.scope, "child");
  assert.equal(m.guardian, null);
  assert.deepEqual(m.children.map((c) => c.id), ["c1"]);
  assert.deepEqual(m.consents, []);
  assert.deepEqual(m.ui, { kaksha: true });
  assert.equal(D.childDeviceMeOf(bootMe, "c9"), null);
  // a refused /api/me falls to the device read; any other failure stays a failure
  const refused = () => Promise.reject(new ApiError(403, "x", { code: "scope.child_device" }));
  await assert.rejects(D.meOrChildDevice(refused), (e) => e.status === 403, "no tx_paired here (node): the refusal stands");
  await assert.rejects(D.meOrChildDevice(() => Promise.reject(new ApiError(500, "x", {}))), (e) => e.status === 500);
  assert.match(read("src/app/api.ts"), /const read = \(\) => meOrChildDevice<Me>\(\(\) => getJson<Me>\("\/api\/me"\)\);/);
  assert.match(read("src/child/api.ts"), /const read = \(\) => meOrChildDevice<MeResponse>\(\(\) => getJson<MeResponse>\("\/api\/me"\)\);/);
});

test("an unpaired device goes back to /pair, gently; the landing greets a paired device as signed in", () => {
  assert.match(read("src/child/ChildShell.tsx"), /if \(e instanceof ApiError && e\.status === 401 && pairedChildId\(\)\) \{ nav\("\/pair\?unpaired=1", \{ replace: true \}\); return; \}/);
  assert.match(read("src/app/Pair.tsx"), /This device was unpaired\. Ask your grown-up for a new code to use it again\./);
  assert.match(read("src/app/landing/Site.tsx"), /tx_paired=/);
});
