export default function Footer({ lastUpdated }) {
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="site-footer__inner">
        <span>© {new Date().getFullYear()} Bang for Your Duck. Free, nonpartisan, independent.</span>
        <nav className="site-footer__links" aria-label="Footer navigation">
          <a href="/" className="site-footer__link">← Provinces</a>
          <span className="site-footer__sep" aria-hidden="true">·</span>
          <a href="https://bangforyourduck.ca" className="site-footer__link" target="_blank" rel="noopener noreferrer">
            bangforyourduck.ca
          </a>
        </nav>
      </div>
    </footer>
  );
}
