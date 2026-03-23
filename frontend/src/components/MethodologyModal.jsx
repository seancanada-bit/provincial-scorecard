import { useEffect } from 'react';

const CATEGORIES = [
  {
    key: 'healthcare', label: 'Healthcare', weight: 16,
    why: 'Whether you can get a family doctor and how long you wait for surgery are the most visceral ways most Canadians experience their provincial government.',
    metrics: [
      { name: 'Surgical wait time',       weight: '⅓', direction: 'lower ↓', best: '19 wks',  worst: '61 wks',  source: 'CIHI' },
      { name: 'Primary care attachment',  weight: '⅓', direction: 'higher ↑', best: '100%',   worst: '70%',     source: 'CIHI' },
      { name: 'ER wait-time benchmark met', weight: '⅓', direction: 'higher ↑', best: '90%', worst: '50%',     source: 'CIHI' },
    ],
  },
  {
    key: 'housing', label: 'Housing', weight: 13,
    why: 'Whether you can afford a home or rent is the defining quality-of-life question for many Canadians, and housing supply is primarily a provincial responsibility.',
    metrics: [
      { name: 'Housing starts per 1k pop. growth', weight: '30%', direction: 'higher ↑', best: '300',  worst: '50',   source: 'CMHC / Stats Can' },
      { name: 'Home price YoY % change',           weight: '25%', direction: 'lower ↓',  best: '−2%',  worst: '+15%', source: 'CREA MLS HPI' },
      { name: 'Rent inflation',                     weight: '25%', direction: 'lower ↓',  best: '0%',   worst: '10%',  source: 'CMHC Rental Market' },
      { name: 'Core housing need rate',             weight: '20%', direction: 'lower ↓',  best: '8%',   worst: '20%',  source: 'CMHC / Stats Can 2021 Census' },
    ],
  },
  {
    key: 'fiscal', label: 'Fiscal', weight: 13,
    why: 'A province spending heavily on debt interest has less money for services. Fiscal health today determines service quality tomorrow.',
    metrics: [
      { name: 'Budget balance % of GDP',         weight: '⅓', direction: 'higher ↑', best: '+1.5%',  worst: '−5%',     source: 'Provincial budgets' },
      { name: 'Debt interest per $ revenue',     weight: '⅓', direction: 'lower ↓',  best: '4¢',     worst: '15¢',     source: 'Provincial budgets' },
      { name: 'Net debt per capita',             weight: '⅓', direction: 'lower ↓',  best: '$5,000', worst: '$40,000', source: 'Stats Can / FP' },
      { name: 'Three-year fiscal trend bonus',   weight: 'adj.', direction: 'n/a',   best: '+5 pts', worst: '−5 pts',  source: 'Trend analysis' },
    ],
  },
  {
    key: 'infrastructure', label: 'Infrastructure', weight: 9,
    why: 'Whether big capital projects come in on time and on budget tells you a lot about government execution. Major overruns crowd out other priorities.',
    metrics: [
      { name: 'Avg project cost overrun', weight: '60%', direction: 'lower ↓', best: '0%',   worst: '100%',  source: 'Project disclosures' },
      { name: 'Avg project delay',        weight: '40%', direction: 'lower ↓', best: '0 mo', worst: '36 mo', source: 'Project disclosures' },
    ],
  },
  {
    key: 'economy', label: 'Economy', weight: 13,
    why: 'Employment, economic growth, credit health, governance quality, workplace safety, and childcare affordability all reflect conditions that are substantially under provincial influence.',
    metrics: [
      { name: 'Employment vs. national (unemp. + GDP avg.)', weight: '25%', direction: 'lower unemp. ↓ / higher GDP ↑', best: '−3pp / +3pp', worst: '+3pp / −3pp', source: 'Stats Can LFS + GDP' },
      { name: 'Credit rating (avg. of agencies)', weight: '20%', direction: 'higher ↑', best: 'Aaa / AAA', worst: 'Baa3 / BBB−', source: 'Moody\'s, DBRS, S&P, Fitch' },
      { name: 'Auditor General opinion',          weight: '20%', direction: 'clean ↑',  best: 'Clean', worst: 'Adverse', source: 'Provincial AGs' },
      { name: 'Workplace injury rate',            weight: '20%', direction: 'lower ↓',  best: '0.8 / 100', worst: '3.0 / 100', source: 'AWCBC (lost-time injuries per 100 workers)' },
      { name: 'Regulated childcare cost',         weight: '15%', direction: 'lower ↓',  best: '$150/mo', worst: '$1,500/mo', source: 'CCPA Childcare Fee Survey 2024' },
    ],
  },
  {
    key: 'education', label: 'Education', weight: 11,
    why: 'Literacy, numeracy, and the cost of higher education shape long-term economic mobility. Outcomes, not just spending, are what matter.',
    metrics: [
      { name: 'PCAP math + reading avg.',   weight: '60%', direction: 'higher ↑', best: '540', worst: '440',     source: 'PCAP (Council of Ministers)' },
      { name: 'University tuition',         weight: '30%', direction: 'lower ↓',  best: '$3,000/yr', worst: '$10,000/yr', source: 'Stats Can TUCC' },
      { name: 'Student–teacher ratio',      weight: '10%', direction: 'lower ↓',  best: '12:1', worst: '21:1',    source: 'Stats Can' },
    ],
  },
  {
    key: 'safety', label: 'Safety', weight: 9,
    why: 'Survey-based victimization avoids reporting-confidence bias that plagues police-reported crime stats. Homicides are always counted.',
    metrics: [
      { name: 'GSS victimization rate',  weight: '50%', direction: 'lower ↓', best: '55 / 1k', worst: '175 / 1k', source: 'Stats Can GSS Cycle 36 (2019)' },
      { name: 'Homicide rate per 100k', weight: '50%', direction: 'lower ↓', best: '0.3',      worst: '6.5',       source: 'Stats Can Homicide Survey (2023)' },
    ],
  },
  {
    key: 'ltc', label: 'Long-Term Care', weight: 8,
    why: 'As the population ages, how provinces fund and staff long-term care — and whether they invest in home care to reduce institutional demand — directly affects quality of life for hundreds of thousands of seniors.',
    metrics: [
      { name: 'LTC beds per 1,000 residents 75+',       weight: '40%', direction: 'higher ↑', best: '80',      worst: '35',     source: 'CIHI Long-Term Care Homes in Canada 2023' },
      { name: 'Direct care hours per resident / day',   weight: '35%', direction: 'higher ↑', best: '4.5 hrs', worst: '2.0 hrs', source: 'CIHI Discharge Abstract Database' },
      { name: 'Home care recipients per 1,000 seniors', weight: '25%', direction: 'higher ↑', best: '100',     worst: '25',     source: 'CIHI Home Care Reporting System 2022' },
    ],
  },
  {
    key: 'mentalhealth', label: 'Mental Health, Addictions & Homelessness', weight: 8,
    why: 'Six metrics spanning crisis outcomes, system capacity, treatment access, and homelessness infrastructure — measuring what provinces actually control across the full continuum from harm reduction to housing.',
    metrics: [
      { name: 'Drug toxicity death rate',       weight: '28%', direction: 'lower ↓',  best: '1.0 / 100k',  worst: '45.0 / 100k', source: 'PHAC (2022)' },
      { name: 'Psychiatric beds per 100k',      weight: '18%', direction: 'higher ↑', best: '60',            worst: '15',          source: 'CIHI (2023)' },
      { name: 'Mental health budget share',     weight: '18%', direction: 'higher ↑', best: '10% of health', worst: '5%',          source: 'CIHI provincial profiles (2023)' },
      { name: 'Addiction recovery beds / 100k', weight: '14%', direction: 'higher ↑', best: '50',            worst: '5',           source: 'CIHI (2023)' },
      { name: 'Supportive housing units / 100k', weight: '14%', direction: 'higher ↑', best: '40',           worst: '2',           source: 'CMHC NHS; provincial housing authorities (2023)' },
      { name: 'OAT access index',               weight: '8%',  direction: 'higher ↑', best: '100',           worst: '30',          source: 'CADTH 2023; provincial prescribing guidelines' },
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

        {/* THE FORMULA */}
        <section className="modal-section">
          <h3>The composite formula</h3>
          <p className="modal-section__intro">
            Each province gets a single 0–100 composite score — a weighted average of nine categories:
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
              For lower-is-better metrics (wait times, debt, crime), best and worst are swapped.
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
              Grades reflect <strong>peer performance within Canada</strong> — not historical change, and not a political judgment.
              Every metric is calibrated against real Canadian data: the "best" bound is set to what the top-performing province
              actually achieves today; the "worst" is set to the weakest. A province scoring a D on healthcare isn't failing by
              some abstract standard — it means other Canadian provinces with comparable resources are delivering measurably better
              outcomes right now.
            </p>
            <p>
              This also explains why some scores look low across the board: if Canada's best surgical wait time is 19 weeks, that
              sets the ceiling. No province scores a perfect 100 on wait times because no province has eliminated the problem —
              they're competing against each other, not against a hypothetical ideal. The grades are a snapshot of
              <em> who is doing better or worse, relative to Canadian peers, at this moment in time.</em>
            </p>
            <p>
              Each category blends several metrics, and different provinces tend to lead on different ones — so even the top province
              on surgical waits may rank poorly on primary care attachment, pulling its overall Healthcare score into the middle of
              the pack. To ensure at least one clear leader emerges per category, scores are peer-normalized after calculation:
              the top Canadian province per category is anchored at <strong>87 (B)</strong>, reflecting that even the best is still
              imperfect. All other provinces scale proportionally beneath that ceiling.
            </p>
          </div>
        </section>

        {/* DUCK SCORE */}
        <section className="modal-section">
          <h3>🦆 Duck Score — bang for your loonie</h3>
          <p>
            The <strong>Duck Score</strong> is the core question this site exists to answer: <em>are you getting what you pay for?</em>
            It's calculated as <em>composite score ÷ tax burden index</em>, where a tax burden index of 100 equals the national average.
          </p>
          <p>
            A province scoring 70 composite with a below-average tax burden (index 90) earns a Duck Score of 78 —
            better bang for your loonie than a province scoring 80 composite but taxing you 20% more than average (index 120),
            which earns only 67. You're paying more and getting less.
          </p>
          <p>
            The Duck Score is shown as a badge on every province card and is available as a sort option.
            It's deliberately separate from the composite — a province can deliver excellent services but still score
            poorly on Duck Score if it taxes heavily to do so. Conversely, a lean-taxing province delivering decent
            services can punch above its weight.
          </p>
        </section>

        {/* FAIRNESS NOTES */}
        <section className="modal-section modal-section--fairness">
          <h3>Fairness — what we do and don't adjust for</h3>

          <div className="modal-fairness-item">
            <span className="modal-fairness-item__label modal-fairness-item__label--good">✓ Already per-capita</span>
            <p>
              Every metric is rate-based or per-capita — wait weeks per patient, debt per resident,
              crimes per 100k, etc. Absolute population size doesn't advantage Ontario or penalize PEI.
            </p>
          </div>

          <div className="modal-fairness-item">
            <span className="modal-fairness-item__label modal-fairness-item__label--note">⚠ Equalization context</span>
            <p>
              Provinces receiving federal equalization payments (currently QC, MB, NS, NB, PE, and
              sometimes NL) have access to more revenue per capita than they generate provincially.
              Quebec's affordable tuition and strong healthcare are partly funded through a system
              that Alberta and Ontario taxpayers contribute to. Fiscal scores don't explicitly
              separate self-generated revenue from federal transfers.
            </p>
          </div>

          <div className="modal-fairness-item">
            <span className="modal-fairness-item__label modal-fairness-item__label--note">⚠ Resource royalty volatility</span>
            <p>
              Alberta, Saskatchewan, and Newfoundland &amp; Labrador receive substantial natural
              resource royalties that fluctuate with commodity prices. In high-price years, fiscal
              scores reflect this windfall; in bust years, deficits appear. These scores measure
              current outcomes, not structural fiscal management capacity.
            </p>
          </div>

          <div className="modal-fairness-item">
            <span className="modal-fairness-item__label modal-fairness-item__label--note">⚠ Geography and service delivery</span>
            <p>
              Delivering healthcare and education to remote, sparsely-populated areas costs far more
              per resident than urban delivery. Newfoundland, northern Manitoba, and Saskatchewan
              face structural challenges that outcome-based metrics don't fully capture.
            </p>
          </div>

          <div className="modal-fairness-item">
            <span className="modal-fairness-item__label modal-fairness-item__label--note">⚠ Safety scores in SK and MB</span>
            <p>
              Saskatchewan and Manitoba's lower safety scores partly reflect historically
              underserved Indigenous communities — a legacy of federal policy and residential
              schools, not solely current provincial governance. The GSS survey captures
              province-wide victimization without separating this structural context.
            </p>
          </div>
        </section>

        {/* ABOUT */}
        <section className="modal-section">
          <h3>About this project</h3>
          <p>
            Provincial Scorecard is maintained by a single individual based in British Columbia,
            not affiliated with any government, political party, or advocacy organization.
            It was built out of genuine frustration at not being able to find a clear, nonpartisan
            comparison of provincial government performance. Data is updated as new figures are released.
            If you find an error or have a data suggestion, please reach out via the footer.
          </p>
        </section>
      </div>
    </div>
  );
}
