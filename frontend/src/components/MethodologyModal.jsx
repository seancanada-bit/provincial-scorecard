import { useEffect } from 'react';

export default function MethodologyModal({ onClose }) {
  // Close on Escape
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-panel" style={{ position: 'relative' }}>
        <button className="modal-panel__close" onClick={onClose} aria-label="Close methodology panel">×</button>

        <h2 className="modal-panel__title" id="modal-title">How we score this</h2>

        <section className="modal-section">
          <h3>What this site measures</h3>
          <p>
            Provincial Scorecard grades each province on five things that affect Canadians' daily lives:
            healthcare delivery, housing affordability, fiscal responsibility, infrastructure delivery,
            and economic and governance health.
          </p>
        </section>

        <section className="modal-section">
          <h3>Why these five categories</h3>
          <p>
            <strong>Healthcare (25%)</strong> — Whether you can get a family doctor and how long you wait
            for surgery are the most visceral ways most Canadians experience their provincial government.
          </p>
          <p>
            <strong>Housing (20%)</strong> — Whether you can afford a home or rent is increasingly the
            defining quality-of-life question for working Canadians, and housing policy is primarily
            a provincial responsibility.
          </p>
          <p>
            <strong>Fiscal responsibility (20%)</strong> — A province spending heavily on debt interest
            has less money for services. Fiscal health today determines service quality tomorrow.
          </p>
          <p>
            <strong>Infrastructure (15%)</strong> — Whether those big capital projects actually come in
            on time and on budget tells you a lot about government competence. Major overruns mean less
            money for other priorities.
          </p>
          <p>
            <strong>Economy & Governance (20%)</strong> — Employment, economic growth, credit ratings,
            and whether the Auditor General has concerns all reflect the underlying health of the province.
          </p>
        </section>

        <section className="modal-section">
          <h3>How the math works</h3>
          <p>
            Each metric gets converted to a 0–100 score. We set a realistic best-case and worst-case
            based on actual Canadian provincial data, then place each province linearly on that scale.
          </p>
          <p>
            For example, surgical wait times: the best-performing province historically averages about
            19 weeks (score: 100), and the worst about 61 weeks (score: 0). A province at 28 weeks
            scores roughly 79 out of 100.
          </p>
          <p>
            Within each category, sub-scores are averaged equally. Categories are then combined using
            the weighted percentages above to produce the composite score.
          </p>
          <p>
            A three-year fiscal trend adds or subtracts 5 points from the fiscal category score to
            reward improvement and flag deterioration.
          </p>
        </section>

        <section className="modal-section">
          <h3>Letter grades</h3>
          <p>
            A+ = 93+ | A = 87–92 | A− = 80–86 | B+ = 77–79 | B = 73–76 | B− = 70–72 |
            C+ = 67–69 | C = 60–66 | C− = 57–59 | D = 40–56 | F = under 40
          </p>
        </section>

        <section className="modal-section">
          <h3>Honest limitations</h3>
          <p>This site cannot capture everything.</p>
          <ul>
            <li>Some data is updated annually, not in real time.</li>
            <li>Infrastructure scoring depends on which projects the maintainer is tracking — we focus on the largest and most publicly reported projects per province.</li>
            <li>Credit ratings are produced by private agencies using their own methodology.</li>
            <li>Premier approval reflects public sentiment, not policy quality directly.</li>
            <li>Smaller provinces have less publicly available data, which may affect score precision.</li>
            <li>This is a one-person project. If you find an error, please contact us.</li>
          </ul>
        </section>

        <section className="modal-section">
          <h3>About the maintainer</h3>
          <p>
            Provincial Scorecard is maintained by a single individual based in British Columbia, not
            affiliated with any government, political party, or advocacy organization. It was built out
            of genuine frustration at not being able to find a clear, nonpartisan comparison of provincial
            government performance. If you have data corrections or suggestions, please reach out via
            the contact link in the footer.
          </p>
        </section>
      </div>
    </div>
  );
}
