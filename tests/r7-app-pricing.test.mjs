// r7 stream E app-pricing-subscription: /pricing is plan cards built from src/app/site.ts (PLANS, PRICES), with no payment
// step. A TBD price says so on its card; a set one shows ₹ per month; nothing on the page charges or asks for a card.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("every plan's price is a PRICES value, and a card's price text follows it", async () => {
  const { PLANS, PRICES, planPrice } = await import("../src/app/site.ts");
  assert.deepEqual(PLANS.map((p) => p.id), ["setup", "child", "sibling"]);
  assert.equal(PLANS[0].price, PRICES.setup);
  assert.equal(PLANS[1].price, PRICES.monthly);
  assert.equal(PLANS[2].price, PRICES.sibling);
  assert.equal(planPrice(0), "Free");
  assert.equal(planPrice("TBD"), null);
  assert.equal(planPrice(1499), "₹1,499");
  for (const p of PLANS) assert.ok(p.includes.length > 0, p.id);
});

test("the page has no payment step and no literal amount", () => {
  const page = read("src/app/landing/Pricing.tsx");
  assert.match(page, /PLANS\.map/);
  assert.match(page, /data-testid="no-payment"/);
  assert.doesNotMatch(page, /₹\s?\d/);
  assert.doesNotMatch(page, /checkout|razorpay|stripe|paytm|upi:|\/api\/(pay|billing|subscri)/i);
  assert.doesNotMatch(page, /<form|type="submit"/);
  // parent copy: no exclamation marks and no dashes in the visible words
  const words = page.replace(/\/\/.*$/gm, "").replace(/\{[^{}]*\}/g, "");
  assert.doesNotMatch(words, /[A-Za-z.]![\s<"]/);
  assert.doesNotMatch(page + read("src/app/site.ts"), /[—–]/);
});

test("/pricing is routed and linked from the header, the footer and the landing's price section", () => {
  assert.match(read("src/app/routes.tsx"), /\{ path: "\/pricing", element: s\(<Pricing \/>\) \}/);
  const site = read("src/app/landing/Site.tsx");
  assert.match(site, /<NavLink to="\/pricing">Pricing<\/NavLink>/);
  assert.match(site, /<Link to="\/pricing">Pricing<\/Link>/);
  assert.match(read("src/app/landing/Landing.tsx"), /to="\/pricing" data-testid="see-plans"/);
});
