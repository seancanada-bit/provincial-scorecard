// Loon silhouette — side profile, low on water, dagger bill pointing left
function LoonIcon() {
  return (
    <svg
      viewBox="0 0 54 26"
      width="38" height="18"
      fill="currentColor"
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px', flexShrink: 0 }}
    >
      <path d="M2,13 L10,6 C13,4 16,5 17,8 C21,10 30,10 42,12 C47,13 51,15 52,18 C51,21 49,22 46,22 C34,25 14,24 6,21 C3,19 1,16 2,13 Z"/>
    </svg>
  );
}

export default function Header({ lastUpdated }) {
  const formatted = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <header className="site-header" role="banner">
      <div className="site-header__inner">
        <a href="/" className="site-header__wordmark" aria-label="Bang for Your Duck home">
          <LoonIcon />
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
