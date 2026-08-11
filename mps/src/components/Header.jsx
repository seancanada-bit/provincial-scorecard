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
            <span className="site-header__sub-nav" aria-label="Current section">
              <a href="/provinces/" className="site-header__sub-link">Provinces</a>
              <span className="site-header__sub-sep" aria-hidden="true">·</span>
              <a href="/cities/" className="site-header__sub-link">Cities</a>
              <span className="site-header__sub-sep" aria-hidden="true">·</span>
              <span className="site-header__sub-current" aria-current="page">MPs</span>
              <span className="site-header__sub-sep" aria-hidden="true">·</span>
              <a href="/methodology/" className="site-header__sub-link">Methodology</a>
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
          <p className="site-header__tagline">What does your riding receive for your federal tax dollar?</p>
          <p className="site-header__scope">Grading all 343 federal ridings on federal investment, transfers, and the cost of representation.</p>
        </div>
      </div>
    </header>
  );
}
