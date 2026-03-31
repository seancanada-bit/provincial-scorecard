import { useEffect } from 'react';

const CATEGORIES = [
  {
    key: 'housing', label: 'Housing & Affordability', weight: 25,
    why: 'Whether you can afford to buy or rent in a city, and how fast new supply is being built, are the most direct measures of how a city government is managing its most critical resource constraint.',
    metrics: [
      { name: 'Housing starts per 1,000 pop.',  weight: '35%', direction: 'higher ↑', best: '10 / 1k',   worst: '0.5 / 1k', source: 'CMHC' },
      { name: 'Rent-to-income ratio',           weight: '35%', direction: 'lower ↓',  best: '25%',        worst: '50%',       source: 'CMHC / Stats Can' },
      { name: 'MLS HPI year-over-year %',       weight: '15%', direction: 'lower ↓',  best: '−10%',       worst: '+15%',      source: 'CREA MLS HPI' },
      { name: 'Avg permit approval days',       weight: '15%', direction: 'lower ↓',  best: '60 days',    worst: '365 days',  source: 'Municipal reports' },
    ],
  },
  {
    key: 'safety', label: 'Safety', weight: 20,
    why: 'The Crime Severity Index weights crimes by their relative seriousness (using sentencing data), making it more meaningful than raw crime counts. A trend bonus rewards cities that are improving.',
    metrics: [
      { name: 'Crime Severity Index (CSI)',    weight: '60%', direction: 'lower ↓',  best: 'CSI 35',  worst: 'CSI 150',  source: 'Stats Can Table 35-10-0026-01' },
      { name: 'Violent Crime Severity Index', weight: '40%', direction: 'lower ↓',  best: 'CSI 25',  worst: 'CSI 120',  source: 'Stats Can Table 35-10-0026-01' },
      { name: '10-year trend bonus',          weight: 'adj.', direction: 'n/a',     best: '+8 pts',  worst: '−8 pts',   source: 'Trend analysis' },
    ],
  },
  {
    key: 'fiscal', label: 'Fiscal Management', weight: 20,
    why: 'A city spending heavily on debt interest has less money for roads and services. Infrastructure investment today determines quality of life tomorrow.',
    metrics: [
      { name: 'Infrastructure spending % of budget', weight: '35%', direction: 'higher ↑', best: '25%',     worst: '5%',       source: 'Municipal financial returns' },
      { name: 'Operating surplus/deficit per capita', weight: '35%', direction: 'higher ↑', best: '+$200',  worst: '−$500',    source: 'Municipal financial returns' },
      { name: 'Net debt per capita',                  weight: '30%', direction: 'lower ↓',  best: '$1,000', worst: '$10,000',  source: 'Municipal financial returns' },
    ],
  },
  {
    key: 'liveability', label: 'Liveability', weight: 15,
    why: 'How long your commute takes, whether public transit is usable, the air you breathe, and access to green space are the day-to-day fabric of urban life.',
    metrics: [
      { name: 'Transit ridership per capita',   weight: '30%', direction: 'higher ↑', best: '150 rides/yr', worst: '10 rides/yr', source: 'Transit agency reports' },
      { name: 'Average commute (minutes)',      weight: '30%', direction: 'lower ↓',  best: '20 min',       worst: '40 min',      source: 'Stats Can Census' },
      { name: 'Parks & rec spending per capita', weight: '20%', direction: 'higher ↑', best: '$300',        worst: '$50',         source: 'Municipal budgets' },
      { name: 'Annual AQHI average',            weight: '20%', direction: 'lower ↓',  best: '2',            worst: '7',           source: 'ECCC' },
    ],
  },
  {
    key: 'economic', label: 'Economic Vitality', weight: 10,
    why: 'Local unemployment, income levels, and population growth signal whether a city is attracting people and jobs — a leading indicator of future service capacity and housing demand.',
    metrics: [
      { name: 'Unemployment vs. national avg', weight: '40%', direction: 'lower ↓',  best: '−1 pp', worst: '+3 pp',  source: 'Stats Can LFS' },
      { name: 'Population growth rate',        weight: '30%', direction: 'higher ↑', best: '3% / yr', worst: '0%',  source: 'Stats Can' },
      { name: 'Median income vs. national',    weight: '30%', direction: 'higher ↑', best: '+20%',  worst: '−20%',  source: 'Stats Can Census' },
    ],
  },
  {
    key: 'community', label: 'Community Investment', weight: 10,
    why: 'How a city addresses homelessness and social services tells you about its values and long-term planning. A trend bonus rewards cities actively improving.',
    metrics: [
      { name: 'Homelessness per 10,000 pop.', weight: '60%', direction: 'lower ↓',  best: '5 / 10k',  worst: '80 / 10k', source: 'CAEH Point-in-Time counts' },
      { name: 'Social services spend per capita', weight: '40%', direction: 'higher ↑', best: '$800', worst: '$100',    source: 'Municipal budgets' },
      { name: 'Homelessness trend bonus',     weight: 'adj.', direction: 'n/a',     best: '+8 pts',  worst: '−8 pts',   source: 'Trend analysis' },
    ],
  },
];

const GRADES = [
  ['A+', '93–100'], ['A', '87–92'], ['A−', '80–86'],
  ['B+', '77–79'],  ['B', '73–76'], ['B−', '70–72'],
  ['C+', '67–69'],  ['C', '60–66'], ['C−', '57–59'],
  ['D', '40–56'],   ['F', '0–39'],
];

const GRADE_COLORS = {
  'A+': '#1B5E20', 'A': '#1B5E20', 'A−': '#1B5E20',
  'B+': '#2E7D32', 'B': '#2E7D32', 'B−': '#2E7D32',
  'C+': '#B45309', 'C': '#B45309', 'C−': '#B45309',
  'D': '#C2410C', 'F': '#B71C1C',
};

export default function MethodologyModal({ onClose }) {
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
      <div className="modal-panel">
        <button className="modal-panel__close" onClick={onClose} aria-label="Close methodology panel">×</button>

        <h2 className="modal-panel__title" id="modal-title">How we score this</h2>

        {/* SCOPE */}
        <section className="modal-section">
          <h3>Which cities are included?</h3>
          <p className="modal-section__intro">
            We rank all <strong>41 Census Metropolitan Areas (CMAs)</strong> in Canada with a core population over
            100,000, as defined by Statistics Canada. CMAs are functional urban regions — they include the central
            city and surrounding municipalities that are economically integrated with it.
          </p>
          <p className="modal-section__intro" style={{ marginTop: 8 }}>
            Cities below 100,000 (e.g. Prince George, Charlottetown, Kamloops — wait, Kamloops is in)
            are excluded not because they're less important, but because consistent, comparable data across
            all six categories is only reliably available for CMAs at this scale.
          </p>
        </section>

        {/* THE FORMULA */}
        <section className="modal-section">
          <h3>The composite formula</h3>
          <p className="modal-section__intro">
            Each city gets a single 0–100 composite score — a weighted average of six categories:
          </p>
          <div className="modal-formula">
            {CATEGORIES.map((cat, i) => (
              <span key={cat.key} className="modal-formula__term">
                <span className="modal-formula__label">{cat.label}</span>
                <span className="modal-formula__weight">×{cat.weight}%</span>
                {i < CATEGORIES.length - 1 && <span className="modal-formula__plus"> + </span>}
              </span>
            ))}
          </div>

          <p className="modal-section__intro" style={{ marginTop: 16 }}>
            Each raw metric is normalized to 0–100 using:
          </p>
          <div className="modal-normalize">
            <span className="modal-normalize__eq">
              score = <span className="modal-normalize__frac">
                <span className="modal-normalize__num">value − worst</span>
                <span className="modal-normalize__den">best − worst</span>
              </span> × 100
            </span>
            <span className="modal-normalize__note">
              For lower-is-better metrics (crime, commute time, rent-to-income), best and worst are swapped.
            </span>
          </div>
        </section>

        {/* CATEGORY BREAKDOWN */}
        <section className="modal-section">
          <h3>Category breakdown</h3>
          {CATEGORIES.map(cat => (
            <div key={cat.key} className="modal-category">
              <div className="modal-category__header">
                <span className="modal-category__name">{cat.label}</span>
                <span className="modal-category__weight">{cat.weight}% of composite</span>
              </div>
              <p className="modal-category__why">{cat.why}</p>
              <table className="modal-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Sub-weight</th>
                    <th>Direction</th>
                    <th>Best → Worst</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {cat.metrics.map(m => (
                    <tr key={m.name}>
                      <td>{m.name}</td>
                      <td className="modal-table__center">{m.weight}</td>
                      <td className="modal-table__center">{m.direction}</td>
                      <td className="modal-table__mono">{m.best} → {m.worst}</td>
                      <td className="modal-table__muted">{m.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </section>

        {/* GRADE SCALE */}
        <section className="modal-section">
          <h3>Letter grades</h3>
          <div className="modal-grades">
            {GRADES.map(([g, range]) => (
              <div key={g} className="modal-grade-chip" style={{ color: GRADE_COLORS[g], borderColor: GRADE_COLORS[g] + '44' }}>
                <span className="modal-grade-chip__letter">{g}</span>
                <span className="modal-grade-chip__range">{range}</span>
              </div>
            ))}
          </div>
          <div className="modal-grade-explainer">
            <h4>What do these grades actually mean?</h4>
            <p>
              Grades reflect <strong>peer performance within Canada</strong> — not historical change, and not
              a political judgment. Every metric is calibrated against real Canadian data: the "best" bound is set
              to what the top-performing city actually achieves today; the "worst" is set to the weakest.
              A city scoring D on fiscal management isn't failing by some abstract standard — it means other
              Canadian cities with comparable resources are delivering measurably better outcomes right now.
            </p>
            <p>
              To ensure at least one clear leader emerges per category, scores are peer-normalized after
              calculation: the top Canadian city per category is anchored at <strong>87 (B)</strong>, reflecting
              that even the best is still imperfect. All other cities scale proportionally beneath that ceiling.
            </p>
          </div>
        </section>

        {/* DUCK SCORE */}
        <section className="modal-section">
          <h3>🦆 Duck Score — bang for your property tax dollar</h3>
          <p>
            The <strong>Duck Score</strong> answers the core question: <em>are you getting what you pay for?</em>
            It's not enough to ask what your property tax <em>rate</em> is — a 0.3% rate on a $1.2M home
            generates a substantial bill. So we calculate the actual <strong>annual property tax on a benchmark
            home</strong> in each city.
          </p>
          <div className="modal-normalize" style={{ margin: '12px 0' }}>
            <span className="modal-normalize__eq" style={{ fontSize: '13px' }}>
              annualTax = (taxRate ÷ 100) × benchmarkPrice<br />
              taxIndex = √(annualTax ÷ $4,500) × 100<br />
              duckScore = composite × 100 ÷ taxIndex
            </span>
          </div>
          <p>
            The $4,500 figure is the approximate national median annual property tax bill on a benchmark home.
            A city at exactly $4,500/year gets a Duck Score equal to its composite score. Cities with lower
            annual bills punch above their composite; cities with higher bills are penalized. The square-root
            curve moderates extreme outliers without eliminating the signal.
          </p>
          <p>
            Property tax rates are the <strong>effective rate on market value</strong>, not the nominal mill
            rate. Manitoba (45% portioning) and Saskatchewan (80% portioning) have their nominal rates adjusted
            downward accordingly — otherwise their rates would appear artificially high relative to provinces
            that assess at full market value.
          </p>
        </section>

        {/* FAIRNESS NOTES */}
        <section className="modal-section modal-section--fairness">
          <h3>Fairness — what we do and don't adjust for</h3>

          <div className="modal-fairness-item">
            <span className="modal-fairness-item__label modal-fairness-item__label--good">✓ Per-capita throughout</span>
            <p>
              Every fiscal metric is per-capita; crime is rate-based; housing starts are per 1,000 population.
              Absolute city size doesn't advantage Toronto or penalize Drummondville.
            </p>
          </div>

          <div className="modal-fairness-item">
            <span className="modal-fairness-item__label modal-fairness-item__label--note">⚠ Property tax portioning (MB, SK)</span>
            <p>
              Manitoba residential property is assessed at 45% of market value; Saskatchewan at 80%.
              Nominal mill rates in these provinces look much higher than Ontario or BC — but the actual
              tax bill is comparable once portioning is applied. We apply these adjustments before calculating
              Duck Scores.
            </p>
          </div>

          <div className="modal-fairness-item">
            <span className="modal-fairness-item__label modal-fairness-item__label--note">⚠ Resource city context</span>
            <p>
              Cities like Red Deer and Lethbridge benefit from Alberta's high property tax revenue base
              and no provincial sales tax — structural advantages not directly attributable to city
              government decisions. Their strong Duck Scores partly reflect provincial fiscal context.
            </p>
          </div>

          <div className="modal-fairness-item">
            <span className="modal-fairness-item__label modal-fairness-item__label--note">⚠ Data gaps</span>
            <p>
              Liveability and Community data is patchier than Housing and Safety data. Where a metric is
              missing for a city, it is excluded from that category's weighted average rather than
              assigned a zero — so scores reflect available data only.
            </p>
          </div>

          <div className="modal-fairness-item">
            <span className="modal-fairness-item__label modal-fairness-item__label--note">⚠ CMA boundaries vs. city limits</span>
            <p>
              Most data is reported at the CMA level, which is larger than the city proper. The crime
              severity index for "Toronto" includes the GTA; "Vancouver" includes Burnaby, Surrey, etc.
              Property tax rates, however, are for the central municipality only.
            </p>
          </div>
        </section>

        {/* ABOUT */}
        <section className="modal-section">
          <h3>About this project</h3>
          <p>
            Bang for Your Duck is maintained by a single individual based in British Columbia,
            not affiliated with any government, political party, or advocacy organization.
            It was built out of genuine frustration at not being able to find a clear, nonpartisan
            comparison of how Canadian cities spend your property tax. Data is updated as new figures
            are released. If you find an error or have a data suggestion, please reach out via the footer.
          </p>
        </section>
      </div>
    </div>
  );
}
