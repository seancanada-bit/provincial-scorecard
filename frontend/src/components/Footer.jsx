export default function Footer({ onMethodology }) {
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="site-footer__inner">
        <span>© {new Date().getFullYear()} Provincial Scorecard. Free, nonpartisan, independent.</span>
        <nav className="site-footer__links" aria-label="Footer navigation">
          <button
            onClick={onMethodology}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '13px', padding: 0 }}
            aria-haspopup="dialog"
          >
            Methodology
          </button>
          <a href="https://github.com/seancanada-bit/provincial-scorecard" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="mailto:hello@example.com">Contact</a>
        </nav>
      </div>
    </footer>
  );
}
