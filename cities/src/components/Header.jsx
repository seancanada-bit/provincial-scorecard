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
              <span className="site-header__sub-current" aria-current="page">Cities</span>
              <span className="site-header__sub-sep" aria-hidden="true">·</span>
              <a href="/mps/" className="site-header__sub-link">MPs</a>
            </span>
            {formatted && (
              <span className="site-header__updated" aria-label={`Data last updated ${formatted}`}>
                Updated {formatted}
              </span>
            )}
          </div>
          <p className="site-header__tagline">Which Canadian city gives you the most bang for your loonie in property tax?</p>
          <p className="site-header__scope">Ranking all 41 Census Metropolitan Areas with core populations over 100,000.</p>
        </div>
        <span className="site-header__duck-hero" aria-hidden="true">🦆</span>
      </div>
    </header>
  );
}
