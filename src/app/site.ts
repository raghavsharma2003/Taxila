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

/**
 * The plans on /pricing (r7 app-pricing-subscription), in page order. Each card's price is a PRICES value, never a
 * literal; `includes` lists only what the product does today. There is no payment step anywhere yet: every card's
 * action is the free set-up, and the page says paying is not open. The owner may rename, reorder or drop a plan here.
 */
export interface Plan {
  id: "setup" | "child" | "sibling";
  name: string;
  /** Who it is for, one short line. */
  forWho: string;
  price: Price | 0;
  /** What the price is per ("month", "month, each"); empty for a free plan. */
  per: string;
  includes: readonly string[];
}
export const PLANS: readonly Plan[] = [
  {
    id: "setup", name: "Set-up", forWho: "Every family starts here", price: PRICES.setup, per: "",
    includes: ["Choose your child's class, board and language", "Meet the teacher and hear her voice", "Our promises on record before you give us anything"],
  },
  {
    id: "child", name: "One child", forWho: "Lessons for one child", price: PRICES.monthly, per: "month",
    includes: ["Voice lessons from your child's own school book", "Games and pictures made for each lesson", "The parent corner: what they really learned, with the evidence"],
  },
  {
    id: "sibling", name: "Brother or sister", forWho: "Each extra child in the family", price: PRICES.sibling, per: "month, each",
    includes: ["Everything in One child", "A separate profile, teacher memory and report for each child"],
  },
];

/** PURE. What a plan card shows as its price: "Free", "₹499", or null while it is TBD (the card says not set yet). */
export const planPrice = (p: Price | 0): string | null => (p === 0 ? "Free" : rupees(p));
