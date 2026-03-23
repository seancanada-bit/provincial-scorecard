// Loon icon — geometric shapes stay crisp at small sizes
// Head (circle) + dagger bill (polygon) + neck (stroke) + low body (ellipse)
function LoonIcon() {
  return (
    <svg
      viewBox="0 0 44 22"
      width="36" height="18"
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '7px', flexShrink: 0 }}
    >
      {/* Body — very low, long */}
      <ellipse cx="28" cy="17" rx="14" ry="4.5" fill="currentColor"/>
      {/* Head */}
      <circle cx="7" cy="9" r="5.5" fill="currentColor"/>
      {/* Bill — dagger pointing left */}
      <polygon points="0,10 7,6 7,12" fill="currentColor"/>
      {/* Neck — thick stroke bridging head and body */}
      <line x1="11" y1="13" x2="17" y2="15" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
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
