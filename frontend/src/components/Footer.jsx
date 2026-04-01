export default function Footer({ onMethodology }) {
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="site-footer__inner">
        <span>© {new Date().getFullYear()} Bang for Your Duck. Community-supported · Nonpartisan · Independent.</span>
        <nav className="site-footer__links" aria-label="Footer navigation">
          <a href="/cities/" className="site-footer__link">Cities</a>
          <span className="site-footer__sep" aria-hidden="true">·</span>
          <a href="/mps/" className="site-footer__link">MPs</a>
          <span className="site-footer__sep" aria-hidden="true">·</span>
          <button
            onClick={onMethodology}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.45)', fontSize: '13px', padding: 0 }}
            aria-haspopup="dialog"
          >
            Methodology
          </button>
          <span className="site-footer__sep" aria-hidden="true">·</span>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px' }}>
            10 provinces · 9 categories
          </span>
        </nav>
      </div>
    </footer>
  );
}
