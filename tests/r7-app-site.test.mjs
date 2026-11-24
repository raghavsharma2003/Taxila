// r7 stream E app-landing-refresh: one config for the public site (the canonical origin and every price, "TBD" until the
// owner sets them), the canonical link per public page, and the landing's captures from the r7 lesson shell.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("every price lives in PRICES; TBD shows the honest 'not set' line, a number shows ₹ per month", async () => {
  const { SITE, PRICES, priceSet, rupees } = await import("../src/app/site.ts");
  assert.equal(SITE.origin, "https://taxila.dev");
  assert.equal(PRICES.monthly, "TBD");
  assert.equal(priceSet("TBD"), false);
  assert.equal(rupees("TBD"), null);
  assert.equal(rupees(1499), "₹1,499");
  const l = read("src/app/landing/Landing.tsx");
  assert.match(l, /priceSet\(PRICES\.monthly\) \?/);
  assert.match(l, /data-testid="price-tbd">We have not set a price for lessons yet/);
  // no literal rupee amount anywhere on the public pages: prices come only from the config
  for (const f of ["src/app/landing/Landing.tsx", "src/app/landing/Site.tsx"]) assert.doesNotMatch(read(f), /₹\s?\d/, f);
});

test("the canonical origin is taxila.dev in the static head and per public page", () => {
  const h = read("index.html");
  assert.match(h, /<link rel="canonical" href="https:\/\/taxila\.dev\/" \/>/);
  assert.match(h, /<meta property="og:url" content="https:\/\/taxila\.dev\/" \/>/);
  assert.doesNotMatch(h, /azurecontainerapps\.io/);
  assert.match(read("src/app/landing/Site.tsx"), /const href = `\$\{SITE\.origin\}\$\{/);
});

test("the landing's lesson captures come from the r7 stage-first shell with the hands-free dock", () => {
  const c = read("tests/prod/r11-site-captures.mjs");
  assert.match(c, /\["desk", `desk\.html\?class=7&fixture=hf-beat/);
  assert.match(c, /\["turn", `desk\.html\?class=7&fixture=hf&/);
});
