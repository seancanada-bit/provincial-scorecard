export default function Footer({ onMethodology }) {
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="site-footer__inner">
        <span>© {new Date().getFullYear()} Bang for Your Duck. Free, nonpartisan, independent.</span>
        <nav className="site-footer__links" aria-label="Footer navigation">
          <a href="/provinces/" className="site-footer__link">← Provinces</a>
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
            Covers 41 CMAs · pop. 100,000+
          </span>
        </nav>
      </div>
    </footer>
  );
}
