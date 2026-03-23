const STRIPE_COFFEE  = 'https://buy.stripe.com/4gM4gA6EF6cQ7iq4ASfUQ00';
const STRIPE_LUNCH   = 'https://buy.stripe.com/3cIbJ2e77eJm32a2sKfUQ01';
const STRIPE_MONTHLY = 'https://buy.stripe.com/eVqfZi2op9p2dGO1oGfUQ02';

const TIERS = [
  {
    id: 'coffee',
    emoji: '☕',
    level: 'Level 1',
    name: 'Quick Thanks',
    price: '$5',
    cadence: 'one-time',
    funds: 'Keeps the site running for a week',
    cta: 'Buy a coffee',
    href: STRIPE_COFFEE,
    highlight: false,
  },
  {
    id: 'lunch',
    emoji: '📊',
    level: 'Level 2',
    name: 'Data Booster',
    price: '$15',
    cadence: 'one-time',
    funds: 'Unlocks a new provincial dataset',
    cta: 'Buy lunch',
    href: STRIPE_LUNCH,
    highlight: true,
    badge: 'Most helpful',
  },
  {
    id: 'monthly',
    emoji: '🇨🇦',
    level: 'Level 3',
    name: 'Province Insider',
    price: '$4',
    cadence: '/mo',
    funds: 'Your name in credits + monthly digest',
    cta: 'Become an Insider',
    href: STRIPE_MONTHLY,
    highlight: false,
    badge: 'Best value',
  },
];

export default function SupportSection({ supporters = [] }) {
  const activeNames = supporters.filter(s => s.active !== false).map(s => s.display_name);

  return (
    <section className="support-section" aria-labelledby="support-heading">
      <h2 className="support-section__header" id="support-heading">
        Help keep provinces accountable.
      </h2>

      <div className="support-section__pitch">
        <p>
          This site runs on public data, paid subscriptions, and a lot of unpaid hours. Better data costs real money — Angus Reid polling, CIHI extracts, infrastructure tracking. Your support tells me to keep digging and make the scores sharper.
        </p>
      </div>

      <div className="support-section__tiers" role="list">
        {TIERS.map(tier => (
          <div
            key={tier.id}
            className={`support-tier${tier.highlight ? ' support-tier--highlight' : ''}`}
            role="listitem"
          >
            {tier.badge && (
              <span className="support-tier__badge">{tier.badge}</span>
            )}
            <span className="support-tier__level">{tier.level}</span>
            <span className="support-tier__emoji" aria-hidden="true">{tier.emoji}</span>
            <strong className="support-tier__name">{tier.name}</strong>
            <div className="support-tier__price">
              <span className="support-tier__amount">{tier.price}</span>
              <span className="support-tier__cadence">{tier.cadence}</span>
            </div>
            <p className="support-tier__funds">{tier.funds}</p>
            <a
              href={tier.href}
              target="_blank"
              rel="noopener noreferrer"
              className="support-tier__cta"
              aria-label={`${tier.cta} — ${tier.price}${tier.cadence}`}
            >
              {tier.cta} →
            </a>
          </div>
        ))}
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
    </section>
  );
}
