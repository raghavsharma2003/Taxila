// /pricing (r7 app-pricing-subscription): the plan cards, built from src/app/site.ts PLANS and PRICES. No payment step
// exists yet: every card's action is the free set-up, a price that is still TBD says so on its card, and the page says
// plainly that nothing is charged. When the owner sets PRICES, the cards show ₹ per month with no other change.
// Parent copy: no exclamation marks and no dashes. One lime element (the PrimaryCta at the foot).
import { Link } from "react-router-dom";
import { Icon } from "../../ui/index.ts";
import { PLANS, planPrice, PRICES, priceSet } from "../site.ts";
import { PrimaryCta, Rupee, SitePage } from "./Site.tsx";

export default function Pricing() {
  const anySet = priceSet(PRICES.monthly) || priceSet(PRICES.sibling);
  return (
    <SitePage title="Pricing">
      <div className="sv-wrap sv-page sv-pricing">
        <p className="kx-label">Price</p>
        <h1 className="sv-page-h1">Plans</h1>
        <p className="sv-lead">Set-up is free. {anySet ? "Lessons are paid by the month, and you can cancel in two taps." : "We have not set a price for lessons yet."}</p>
        <ul className="sv-plans" aria-label="Plans">
          {PLANS.map((p) => {
            const price = planPrice(p.price);
            return (
              <li key={p.id} className="sv-panel sv-plan" data-testid={`plan-${p.id}`}>
                <h2 className="sv-plan-name">{p.name}</h2>
                <p className="sv-plan-for">{p.forWho}</p>
                {price ? (
                  <p className="sv-plan-price" data-testid={`plan-${p.id}-price`}>
                    <b>{price}</b>{p.per && <span> per {p.per}</span>}
                  </p>
                ) : (
                  <p className="sv-plan-price sv-plan-price--tbd" data-testid={`plan-${p.id}-tbd`}>
                    <b>Not set yet</b><span> in <Rupee /> per {p.per}</span>
                  </p>
                )}
                <ul className="sv-list sv-plan-list">{p.includes.map((t) => <li key={t}>{t}</li>)}</ul>
              </li>
            );
          })}
        </ul>
        <p className="sv-callout" data-testid="no-payment">
          Paying is not open yet. Nothing is charged and there is no card to enter. Before you pay anything, the price will be on this page, with what stays free and how to cancel.
        </p>
        <h2 className="sv-page-h2">Questions about paying</h2>
        <ul className="sv-list">
          <li><strong>Do I need a card to start?</strong> No. Set-up and meeting the teacher need no card and no payment.</li>
          <li><strong>How will I cancel?</strong> Paying is not open yet. When it opens, cancelling will be in the parent corner, and this page will say exactly what happens to the month you paid for.</li>
          <li><strong>What happens to my child's data if I stop?</strong> You choose. You can keep the profile, or delete it with every lesson and answer. See <Link to="/promises">our promises</Link>.</li>
        </ul>
        <div className="sv-row-actions sv-pricing-cta"><PrimaryCta /></div>
        <p className="sv-pricing-back"><Link to="/" className="sv-more">Back to the home page <Icon name="chevron" /></Link></p>
      </div>
    </SitePage>
  );
}
