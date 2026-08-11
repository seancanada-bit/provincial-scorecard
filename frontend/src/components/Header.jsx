export default function Header({ lastUpdated }) {
  const formatted = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <header className="site-header" role="banner">
      <div className="site-header__inner">
        <div className="site-header__text">
          <div className="site-header__top">
            <a href="/" className="site-header__wordmark" aria-label="Nonpartisan Governance Ledger home">
              <span className="site-header__wordmark-line1">Nonpartisan Governance</span>{' '}
              <span className="site-header__wordmark-accent">Ledger</span>
            </a>
            <span className="site-header__sub-nav" aria-label="Sections">
              <span className="site-header__sub-current" aria-current="page">Provinces</span>
              <span className="site-header__sub-sep" aria-hidden="true">·</span>
              <a href="/cities/" className="site-header__sub-link">Cities</a>
              <span className="site-header__sub-sep" aria-hidden="true">·</span>
              <a href="/mps/" className="site-header__sub-link">MPs</a>
            </span>
            <div className="site-header__actions">
              {formatted && (
                <span className="site-header__updated" aria-label={`Data last updated ${formatted}`}>
                  Updated {formatted}
                </span>
              )}
              <a href="/#support" className="site-header__support-btn">Support this project</a>
            </div>
          </div>
          <p className="site-header__tagline">Which province delivers the best value for your tax dollar?</p>
        </div>
      </div>
    </header>
  );
}
