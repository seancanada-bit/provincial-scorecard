const STRIPE_LOONIE   = 'https://buy.stripe.com/4gM4gA6EF6cQ7iq4ASfUQ00'; // $5 one-time
const STRIPE_RESEARCH = 'https://buy.stripe.com/dRmaEYe770Sw32a7N4fUQ03'; // $20 one-time
const STRIPE_KEEPER   = 'https://buy.stripe.com/cNicN62opfNqcCKebsfUQ04'; // $6/mo recurring

const TIERS = [
  {
    id: 'loonie',
    emoji: '🦆',
    name: 'Toss a Loonie',
    price: '$5',
    cadence: 'one-time',
    funds: 'Keeps the server running. Every one counts.',
    cta: 'Chip in $5',
    href: STRIPE_LOONIE,
    highlight: false,
  },
  {
    id: 'research',
    emoji: '🔬',
    name: 'Fund the Research',
    price: '$20',
    cadence: 'one-time',
    funds: 'Directly pays for data, hosting, and the hours behind the numbers.',
    cta: 'Fund it',
    href: STRIPE_RESEARCH,
    highlight: false,
  },
  {
    id: 'keeper',
    emoji: '🇨🇦',
    name: 'Province Keeper',
    price: '$6',
    cadence: '/mo',
    funds: 'Your name on the site + a note when scores are updated.',
    cta: 'Become a Keeper',
    href: STRIPE_KEEPER,
    highlight: true,
    badge: 'Recommended',
  },
];

export default function SupportSection({ supporters = [] }) {
  const activeNames = supporters.filter(s => s.active !== false).map(s => s.display_name);

  return (
    <section className="support-section" aria-labelledby="support-heading">
      <h2 className="support-section__header" id="support-heading">
        Help keep cities accountable.
      </h2>

      <div className="support-section__pitch">
        <p>
          This site costs real money to run — hosting, data subscriptions, and a lot of unpaid
          hours tracking down numbers municipalities don't make easy to find. If you've ever
          shared it, argued about it, or used it to form an opinion, consider kicking in.
        </p>
      </div>

      <div className="support-section__tiers" role="list">
        {TIERS.map(tier => (
          <div
            key={tier.id}
            className={`support-tier${tier.highlight ? ' support-tier--highlight' : ''}`}
            role="listitem"
          >
            {tier.badge && <span className="support-tier__badge">{tier.badge}</span>}
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
          Province Keepers keeping this running:{' '}
          <span className="supporters-wall__names">{activeNames.join(', ')}</span>
        </div>
      )}
    </section>
  );
}
