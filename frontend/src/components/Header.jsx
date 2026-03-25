export default function Header({ lastUpdated }) {
  const formatted = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <header className="site-header" role="banner">
      <div className="site-header__inner">
        <div className="site-header__top">
          <a href="/" className="site-header__wordmark" aria-label="Bang for Your Duck home">
            <span className="site-header__brand">Bang for Your <span>Duck</span><span className="site-header__duck" aria-hidden="true"> 🦆</span></span>
          </a>
          {formatted && (
            <span className="site-header__updated" aria-label={`Data last updated ${formatted}`}>
              Updated {formatted}
            </span>
          )}
        </div>
        <p className="site-header__tagline">Which province gives you the most for your loonie?</p>
      </div>
    </header>
  );
}
