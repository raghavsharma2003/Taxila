// The public site's one config (r7 app-landing-refresh, app-pricing-subscription). Every price shown anywhere comes from
// PRICES; until the owner sets a number each value is "TBD" and the pages say plainly that no price is set yet. The owner's
// number drops in here with no other code change (tests/r7-app-site.test.mjs).
export const SITE = {
  /** The canonical origin (the managed certificates on taxila-env are for taxila.dev and www.taxila.dev). */
  origin: "https://taxila.dev",
  /** The share card (Open Graph). */
  shareImage: "/brand/share-1200x630.png",
} as const;

export type Price = number | "TBD";

/** ₹ per month. "TBD": not set (the owner's decision). */
export const PRICES = {
  /** One child's lessons, per month. */
  monthly: "TBD" as Price,
  /** Each extra child in the same family, per month. */
  sibling: "TBD" as Price,
  /** Set-up and the first meeting with her are always free (a promise on the page, not a price). */
  setup: 0 as const,
};

export const priceSet = (p: Price): p is number => typeof p === "number" && p > 0;
/** "₹499" style text for a set price (Indian digit grouping); null while it is TBD. */
export const rupees = (p: Price): string | null => (priceSet(p) ? `₹${p.toLocaleString("en-IN")}` : null);
