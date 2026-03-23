export default function Header({ lastUpdated }) {
  const formatted = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <header className="site-header" role="banner">
      <div className="site-header__inner">
        <a href="/" className="site-header__wordmark" aria-label="Bang for Your Duck home">
          Bang for Your <span>Duck</span>
        </a>
        <p className="site-header__tagline">Which province gives you the most for your loonie?</p>
        {formatted && (
          <span className="site-header__updated" aria-label={`Data last updated ${formatted}`}>
            Updated {formatted}
          </span>
        )}
      </div>
    </header>
  );
}
