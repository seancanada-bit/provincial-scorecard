export default function Footer() {
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="site-footer__inner">
        <span>© {new Date().getFullYear()} Bang for Your Duck. Community-supported · Nonpartisan · Independent.</span>
        <nav className="site-footer__links" aria-label="Footer navigation">
          <a href="/provinces/" className="site-footer__link">← Provinces</a>
          <span className="site-footer__sep" aria-hidden="true">·</span>
          <a href="/cities/" className="site-footer__link">Cities</a>
          <span className="site-footer__sep" aria-hidden="true">·</span>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px' }}>
            338 federal ridings · 44th Parliament
          </span>
        </nav>
      </div>
    </footer>
  );
}
