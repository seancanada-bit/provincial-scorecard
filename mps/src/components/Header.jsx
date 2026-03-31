export default function Header({ lastUpdated }) {
  const formatted = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <header className="site-header" role="banner">
      <div className="site-header__inner">
        <div className="site-header__text">
          <div className="site-header__top">
            <a href="/" className="site-header__wordmark" aria-label="Bang for Your Duck home">
              <span className="site-header__brand">Bang for Your <span>Duck</span></span>
            </a>
            <span className="site-header__sub-nav" aria-label="Current section">
              <a href="/provinces/" className="site-header__sub-link">Provinces</a>
              <span className="site-header__sub-sep" aria-hidden="true">·</span>
              <a href="/cities/" className="site-header__sub-link">Cities</a>
              <span className="site-header__sub-sep" aria-hidden="true">·</span>
              <span className="site-header__sub-current" aria-current="page">MPs</span>
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
          <p className="site-header__tagline">What does your MP deliver for the federal tax dollars your riding generates?</p>
          <p className="site-header__scope">Grading all 343 federal electoral ridings on MP performance, investment, and outcomes.</p>
        </div>
        <span className="site-header__duck-hero" aria-hidden="true">🦆</span>
      </div>
    </header>
  );
}
