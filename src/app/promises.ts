// The site's promises as data only (no component, no stylesheet): read by the landing, /promises and the onboarding
// promises step (src/onboarding/Consent.tsx), so set-up never pulls the marketing chunk or landing.css.
import type { IconName } from "../ui/index.ts";

export interface SitePromise { id: string; art: string; icon: IconName; title: string; short: string; detail: string[] }

/** The four promises, with their spot art ids (MANIFEST promises/*). */
export const SITE_PROMISES: SitePromise[] = [
  {
    id: "ai-honest", art: "promises/ai-honest", icon: "shield", title: "The teacher is an AI, and says so",
    short: "Your child is told at the first meeting, and an AI label sits next to the teacher on every screen.",
    detail: [
      "Whatever name your child gives the teacher, it never claims to be a person, a friend or family.",
      "If a child is upset or unsafe, the teacher stops the lesson, gives the Childline and Tele-MANAS numbers and asks them to find a grown-up.",
    ],
  },
  {
    id: "you-see", art: "promises/you-see", icon: "eye", title: "You see what your child sees",
    short: "Every claim about your child's learning has \"How do we know?\" behind it: the check, the time and your child's own words.",
    detail: [
      "You can read each lesson your child had, in the parent corner, behind your PIN.",
      "If we cannot point to a check, we do not make the claim.",
    ],
  },
  {
    id: "no-ads", art: "promises/no-ads", icon: "noCall", title: "No ads, no sales calls, no loans",
    short: "Your child never sees an ad. Nobody from Taxila will phone you to sell anything, and we never offer loans or EMI.",
    detail: [
      "Your phone number is for your child's reports and your account, nothing else.",
      "When paid plans start, you will see the price in rupees per month before you pay, and you can cancel in two taps.",
    ],
  },
  {
    id: "delete", art: "promises/delete", icon: "trash", title: "Delete anything, any time",
    short: "See what we keep about your child, and delete the profile or your whole account from the parent corner.",
    detail: [
      "Deleting a child removes every lesson, answer and note with it.",
      "Audio of your child's voice is never stored.",
    ],
  },
];

/** The older shape, read by the onboarding promises step (src/onboarding/Consent.tsx reads [0] = no sales calls,
 *  [2] = delete): kept index-compatible. */
export const PROMISES: { icon: IconName; title: string; body: string }[] = [
  { icon: "noCall", title: "No sales calls", body: "Nobody from Taxila will phone you to sell anything. Your number is for your child's reports and your account, nothing else." },
  { icon: "noLoan", title: "No loans, no EMI", body: "We never offer loans, EMI or finance. When paid plans start, you will see the price in rupees per month before you pay, and you can cancel in two taps." },
  { icon: "trash", title: "Delete anything", body: SITE_PROMISES[3].short },
];

