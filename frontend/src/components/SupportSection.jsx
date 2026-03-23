// Replace the href values with your actual Ko-fi URLs before deploying
const KOFI_COFFEE  = 'https://ko-fi.com/goodgovernance';
const KOFI_LUNCH   = 'https://ko-fi.com/goodgovernance';
const KOFI_MONTHLY = 'https://ko-fi.com/goodgovernance/tiers';

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
          href={KOFI_COFFEE}
          target="_blank"
          rel="noopener noreferrer"
          className="support-btn support-btn--coffee"
          aria-label="Buy a coffee, one-time $5 donation via Ko-fi"
        >
          ☕ Buy a coffee — $5
        </a>
        <a
          href={KOFI_LUNCH}
          target="_blank"
          rel="noopener noreferrer"
          className="support-btn support-btn--lunch"
          aria-label="Buy lunch, one-time $15 donation via Ko-fi"
        >
          🍱 Buy lunch — $15
        </a>
        <a
          href={KOFI_MONTHLY}
          target="_blank"
          rel="noopener noreferrer"
          className="support-btn support-btn--monthly"
          aria-label="Become a monthly supporter, $4 per month via Ko-fi"
        >
          ⭐ Monthly supporter — $4/mo
        </a>
      </div>

      <p className="support-note">
        Payments go directly to Pacific Logo Design via Ko-fi. Zero platform fee on tips.
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
