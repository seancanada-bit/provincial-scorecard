const STRIPE_COFFEE  = 'https://buy.stripe.com/4gM4gA6EF6cQ7iq4ASfUQ00';
const STRIPE_LUNCH   = 'https://buy.stripe.com/3cIbJ2e77eJm32a2sKfUQ01';
const STRIPE_MONTHLY = 'https://buy.stripe.com/eVqfZi2op9p2dGO1oGfUQ02';

export default function SupportSection({ supporters = [] }) {
  const activeNames = supporters.filter(s => s.active !== false).map(s => s.display_name);

  return (
    <section className="support-section" aria-labelledby="support-heading">
      <h2 className="support-section__header" id="support-heading">
        Is this useful? Tell me with a coffee.
      </h2>

      <div className="support-section__body">
        <p>
          I built Provincial Scorecard because I couldn't find anything like it anywhere — a single
          place where an average Canadian can see how their province is actually performing on the things
          that matter most. Healthcare wait times. Housing affordability. Whether those big infrastructure
          projects came in on time and on budget. Fiscal responsibility.
        </p>
        <p>
          I'm doing this off the side of my desk. It's publicly available data, my own time, and genuine
          curiosity about whether better information can help hold provincial governments accountable.
        </p>
        <p>
          Two things would genuinely help:
        </p>
        <p>
          <strong>Knowing this is useful.</strong> Without some signal that people are finding this
          worthwhile, it's hard to justify the ongoing hours. A donation — even a small one — tells me
          to keep going.
        </p>
        <p>
          <strong>Unlocking richer data.</strong> Some of the best provincial data sources cost money or
          significant time to access properly — detailed Angus Reid provincial polling breakdowns, custom
          CIHI health extracts, more thorough infrastructure project tracking. If this project gets
          traction, I want to make the scores sharper and more comprehensive. That takes resources I
          don't currently have.
        </p>
        <p>
          If you find it useful, buy me a coffee. If a lot of people find it useful, I'll know to invest
          in making it better.
        </p>
      </div>

      <div className="support-section__buttons">
        <a
          href={STRIPE_COFFEE}
          target="_blank"
          rel="noopener noreferrer"
          className="support-btn support-btn--coffee"
          aria-label="One-time $5 donation via Stripe"
        >
          ☕ Buy a coffee — $5
        </a>
        <a
          href={STRIPE_LUNCH}
          target="_blank"
          rel="noopener noreferrer"
          className="support-btn support-btn--lunch"
          aria-label="One-time $15 donation via Stripe"
        >
          🍱 Buy lunch — $15
        </a>
        <a
          href={STRIPE_MONTHLY}
          target="_blank"
          rel="noopener noreferrer"
          className="support-btn support-btn--monthly"
          aria-label="$4 per month recurring support via Stripe"
        >
          ⭐ Monthly supporter — $4/mo
        </a>
      </div>

      <p className="support-note">
        Payments processed securely by Stripe. Cancel monthly support any time.
      </p>

      {activeNames.length > 0 && (
        <div className="supporters-wall" aria-label="Current supporters">
          Supporters keeping this running:{' '}
          <span className="supporters-wall__names">{activeNames.join(', ')}</span>
        </div>
      )}

      <div className="insider-teaser" aria-label="Coming soon: Province Insider membership">
        <strong>Province Insider — coming soon.</strong>{' '}
        Monthly digest of score updates, early access to new data categories, and your name
        in the supporters section.
      </div>
    </section>
  );
}
