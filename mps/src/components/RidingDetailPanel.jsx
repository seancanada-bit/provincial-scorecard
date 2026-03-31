import { useState } from 'react';
import { gradeFill, gradeColorClass, scoreFill, toGrade, PROVINCE_NAMES } from '../utils/grading.js';
import { track } from '../utils/track.js';

const TABS = [
  { key: 'performance',  label: 'MP Work',    icon: '🏛️' },
  { key: 'investment',   label: 'Investment',  icon: '💰' },
  { key: 'electoral',    label: 'Electoral',   icon: '🗳️' },
  { key: 'demographics', label: 'Demographics',icon: '📊' },
  { key: 'expenses',     label: 'Expenses',    icon: '📋' },
  { key: 'transfers',    label: 'Transfers',   icon: '🔄' },
];

function MetricRow({ label, score, rawDisplay, compareDisplay }) {
  if (score === null || score === undefined) return null;
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div className="dp-metric">
      <div className="dp-metric__label">{label}</div>
      <div className="dp-metric__track" role="progressbar" aria-valuenow={pct}>
        <div className="dp-metric__fill" style={{ width: `${pct}%`, background: scoreFill(score) }} />
      </div>
      <div className="dp-metric__meta">
        <span className="dp-metric__raw">{rawDisplay}</span>
        {compareDisplay && <span className="dp-metric__compare">{compareDisplay}</span>}
      </div>
    </div>
  );
}

function KeyStat({ value, unit, label, score, grade }) {
  return (
    <div className="dp-keystat">
      <div className="dp-keystat__value">
        <span className="dp-keystat__number">{value}</span>
        {unit && <span className="dp-keystat__unit">{unit}</span>}
      </div>
      <div className="dp-keystat__label">{label}</div>
      {grade && <span className={`dp-keystat__grade ${gradeColorClass(grade)}`}>{grade} · {score}/100</span>}
    </div>
  );
}

function PerformanceTab({ c }) {
  const p = c.performance;
  if (!p) return <div className="dp-tab-content"><p className="dp-empty">MP performance data not yet available.</p></div>;
  return (
    <div className="dp-tab-content">
      <KeyStat value={p.voteParticipationPct != null ? `${p.voteParticipationPct}%` : '—'} label="vote participation rate" score={p.score} grade={p.grade} />
      <div className="dp-metrics">
        <MetricRow label="Vote participation" score={p.voteScore} rawDisplay={p.voteParticipationPct != null ? `${p.voteParticipationPct}%` : '—'} compareDisplay="Best: 95%+" />
        <MetricRow label="Bills introduced" score={p.billsScore} rawDisplay={p.billsIntroduced != null ? `${p.billsIntroduced} bills` : '—'} compareDisplay="Higher = more active" />
        <MetricRow label="Committee memberships" score={p.committeeScore} rawDisplay={p.committeeMemberships != null ? `${p.committeeMemberships}` : '—'} compareDisplay="Max: 4+" />
        <MetricRow label="Speeches / interventions" score={p.speechScore} rawDisplay={p.speechesCount != null ? `${p.speechesCount}` : '—'} compareDisplay="Higher = more engaged" />
      </div>
      {p.isOpposition && <p className="dp-note">+5 fairness bonus (opposition MP)</p>}
      <p className="dp-source">Source: OpenParliament.ca · {p.dataDate ?? '2024'}</p>
    </div>
  );
}

function InvestmentTab({ c }) {
  const inv = c.investment;
  if (!inv) return <div className="dp-tab-content"><p className="dp-empty">Federal investment data not yet available.</p></div>;
  return (
    <div className="dp-tab-content">
      <KeyStat value={inv.infrastructureGrantsPerCapita != null ? `$${inv.infrastructureGrantsPerCapita}` : '—'} label="federal grants per capita" score={inv.score} grade={inv.grade} />
      <div className="dp-metrics">
        <MetricRow label="Infrastructure grants/capita" score={inv.grantsScore} rawDisplay={inv.infrastructureGrantsPerCapita != null ? `$${inv.infrastructureGrantsPerCapita}` : '—'} compareDisplay="Higher = more investment" />
        <MetricRow label="Federal contracts/capita" score={inv.contractsScore} rawDisplay={inv.federalContractsPerCapita != null ? `$${inv.federalContractsPerCapita}` : '—'} compareDisplay="Higher = more activity" />
        <MetricRow label="Federal facilities" score={inv.facilitiesScore} rawDisplay={inv.federalFacilitiesCount != null ? `${inv.federalFacilitiesCount}` : '—'} compareDisplay="Buildings, bases, labs" />
      </div>
      <p className="dp-source">Source: GC InfoBase · Infrastructure Canada · {inv.dataDate ?? '2023'}</p>
    </div>
  );
}

function ElectoralTab({ c }) {
  const e = c.electoral;
  if (!e) return <div className="dp-tab-content"><p className="dp-empty">Electoral data not yet available.</p></div>;
  return (
    <div className="dp-tab-content">
      <KeyStat value={e.voterTurnoutPct != null ? `${e.voterTurnoutPct}%` : '—'} label="voter turnout" score={e.score} grade={e.grade} />
      <div className="dp-metrics">
        <MetricRow label="Voter turnout" score={e.turnoutScore} rawDisplay={e.voterTurnoutPct != null ? `${e.voterTurnoutPct}%` : '—'} compareDisplay="Nat'l avg: 62.3%" />
        <MetricRow label="Turnout vs national" score={e.turnoutDeltaScore} rawDisplay={e.turnoutVsNational != null ? `${e.turnoutVsNational > 0 ? '+' : ''}${e.turnoutVsNational}pp` : '—'} compareDisplay="Above avg = healthier" />
        <MetricRow label="Margin of victory" score={e.marginScore} rawDisplay={e.marginOfVictoryPct != null ? `${e.marginOfVictoryPct}%` : '—'} compareDisplay="Closer = more competitive" />
        <MetricRow label="Candidates" score={e.candidateScore} rawDisplay={e.candidatesCount != null ? `${e.candidatesCount}` : '—'} compareDisplay="More = healthier democracy" />
      </div>
      <p className="dp-source">Source: Elections Canada · {e.dataDate ?? '2021'}</p>
    </div>
  );
}

function DemographicsTab({ c }) {
  const d = c.demographics;
  if (!d) return <div className="dp-tab-content"><p className="dp-empty">Demographic data not yet available.</p></div>;
  return (
    <div className="dp-tab-content">
      <KeyStat value={d.medianHouseholdIncome != null ? `$${d.medianHouseholdIncome.toLocaleString('en-CA')}` : '—'} label="median household income" score={d.score} grade={d.grade} />
      <div className="dp-metrics">
        <MetricRow label="Income vs national" score={d.incomeScore} rawDisplay={d.incomeVsNationalPct != null ? `${d.incomeVsNationalPct > 0 ? '+' : ''}${d.incomeVsNationalPct}%` : '—'} compareDisplay="Higher = above avg" />
        <MetricRow label="Unemployment rate" score={d.unemployScore} rawDisplay={d.unemploymentRate != null ? `${d.unemploymentRate}%` : '—'} compareDisplay="Nat'l avg: 6.3%" />
        <MetricRow label="Post-secondary education" score={d.educationScore} rawDisplay={d.postsecondaryRate != null ? `${d.postsecondaryRate}%` : '—'} compareDisplay="Higher = more educated" />
        <MetricRow label="Immigration rate" score={d.immigrationScore} rawDisplay={d.immigrationPct != null ? `${d.immigrationPct}%` : '—'} compareDisplay="Proxy for attractiveness" />
      </div>
      <p className="dp-source">Source: Statistics Canada Census 2021</p>
    </div>
  );
}

function ExpensesTab({ c }) {
  const ex = c.expenses;
  if (!ex) return <div className="dp-tab-content"><p className="dp-empty">MP expense data not yet available.</p></div>;
  return (
    <div className="dp-tab-content">
      <KeyStat value={ex.totalExpenses != null ? `$${ex.totalExpenses.toLocaleString('en-CA')}` : '—'} label="total MP expenses" score={ex.score} grade={ex.grade} />
      <div className="dp-metrics">
        <MetricRow label="Total expenses" score={ex.expenseScore} rawDisplay={ex.totalExpenses != null ? `$${ex.totalExpenses.toLocaleString('en-CA')}` : '—'} compareDisplay="Lower = more responsible" />
        <MetricRow label="Travel cost per km from Ottawa" score={ex.travelKmScore} rawDisplay={ex.travelPerKm != null ? `$${ex.travelPerKm}/km` : '—'} compareDisplay="Distance-normalized" />
        <MetricRow label="Hospitality spending" score={ex.hospitalityScore} rawDisplay={ex.hospitalityExpenses != null ? `$${ex.hospitalityExpenses.toLocaleString('en-CA')}` : '—'} compareDisplay="Lower = better" />
      </div>
      {ex.distanceFromOttawaKm && <p className="dp-note">{ex.distanceFromOttawaKm} km from Ottawa</p>}
      <p className="dp-source">Source: House of Commons Disclosure · {ex.dataDate ?? '2024'}</p>
    </div>
  );
}

function TransfersTab({ c }) {
  const t = c.transfers;
  if (!t) return <div className="dp-tab-content"><p className="dp-empty">Federal transfer data not yet available.</p></div>;
  return (
    <div className="dp-tab-content">
      <KeyStat value={t.totalTransfersPerCapita != null ? `$${t.totalTransfersPerCapita.toLocaleString('en-CA')}` : '—'} label="federal transfers per capita" score={t.score} grade={t.grade} />
      <div className="dp-metrics">
        {t.chtPerCapita != null && <MetricRow label="Canada Health Transfer" score={null} rawDisplay={`$${t.chtPerCapita}/person`} />}
        {t.cstPerCapita != null && <MetricRow label="Canada Social Transfer" score={null} rawDisplay={`$${t.cstPerCapita}/person`} />}
        {t.equalizationPerCapita != null && <MetricRow label="Equalization" score={null} rawDisplay={t.equalizationPerCapita > 0 ? `$${t.equalizationPerCapita}/person` : 'Not a receiving province'} />}
        {t.gasTaxPerCapita != null && <MetricRow label="Gas tax transfer" score={null} rawDisplay={`$${t.gasTaxPerCapita}/person`} />}
      </div>
      <p className="dp-note">Provincial-level data allocated per capita — all ridings in the same province receive the same transfer score.</p>
      <p className="dp-source">Source: Dept of Finance · {t.dataDate ?? '2023'}</p>
    </div>
  );
}

const TAB_CONTENT = {
  performance:  PerformanceTab,
  investment:   InvestmentTab,
  electoral:    ElectoralTab,
  demographics: DemographicsTab,
  expenses:     ExpensesTab,
  transfers:    TransfersTab,
};

export default function RidingDetailPanel({ riding, onClose, sortKey, partyColors }) {
  const [activeTab, setActiveTab] = useState(
    TABS.find(t => t.key === sortKey)?.key ?? 'performance'
  );

  const color      = partyColors[riding.mpParty] ?? '#555';
  const cats       = riding.categories;
  const TabComponent = TAB_CONTENT[activeTab];

  const handleTabChange = key => {
    setActiveTab(key);
    track('riding_tab', { city: riding.ridingCode, detail: key });
  };

  const duckGrade = riding.duckScore != null ? toGrade(riding.duckScore) : null;

  return (
    <aside className="city-detail-panel" aria-label={`Details for ${riding.name}`}>
      {/* Header */}
      <div className="dp-header" style={{ '--city-color': color }}>
        <button className="dp-close" onClick={onClose} aria-label="Close riding details">✕</button>
        <div className="dp-header__badge" style={{ background: color }} aria-hidden="true">
          <span className="dp-header__abbr">{riding.province}</span>
        </div>
        <div className="dp-header__text">
          <h2 className="dp-header__name">{riding.name}</h2>
          <p className="dp-header__meta">
            {riding.mpName ?? 'Vacant'} · {riding.mpParty}
            {riding.population && ` · Pop. ${riding.population.toLocaleString('en-CA')}`}
          </p>
        </div>
        <div className="dp-header__scores">
          <div className="dp-header__score-block">
            <span className="dp-header__score-label">performance</span>
            <span className={`dp-header__grade ${gradeColorClass(riding.grade)}`}>{riding.grade}</span>
            <span className="dp-header__num">{riding.composite}/100</span>
          </div>
          {duckGrade && (
            <div className="dp-header__score-block dp-header__score-block--duck">
              <span className="dp-header__score-label">🦆 value</span>
              <span className={`dp-header__grade ${gradeColorClass(duckGrade)}`}>{duckGrade}</span>
              <span className="dp-header__num">{riding.duckScore}/100</span>
            </div>
          )}
        </div>
      </div>

      {/* Category chips */}
      <div className="dp-cat-scroll-wrap">
        <div className="dp-cat-row" role="list" aria-label="Category scores">
          {TABS.map(tab => {
            const cat   = cats[tab.key];
            const score = cat?.score ?? 0;
            const grade = cat?.grade ?? 'N/A';
            return (
              <button
                key={tab.key}
                role="listitem"
                className={`dp-cat-chip${activeTab === tab.key ? ' dp-cat-chip--active' : ''}`}
                style={{ color: gradeFill(grade), background: activeTab === tab.key ? `${gradeFill(grade)}18` : undefined }}
                onClick={() => handleTabChange(tab.key)}
                aria-pressed={activeTab === tab.key}
              >
                <span className="dp-cat-chip__icon" aria-hidden="true">{tab.icon}</span>
                <span className="dp-cat-chip__label">{tab.label}</span>
                <span className="dp-cat-chip__score">{score}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="dp-body">
        <TabComponent c={cats} />
      </div>

      {/* Duck score callout */}
      {duckGrade && (
        <div className="dp-duck-callout">
          <span className="dp-duck-callout__emoji" aria-hidden="true">🦆</span>
          <div className="dp-duck-callout__text">
            <strong>Bang for Your Duck: {duckGrade} · {riding.duckScore}/100</strong>
            <p>
              {riding.duckScore >= 87 ? 'Exceptional value for federal tax dollars generated by this riding.' :
               riding.duckScore >= 73 ? 'Solid return on federal tax contribution.' :
               riding.duckScore >= 57 ? 'Moderate value — room for improvement.' :
               'Below-average return for the federal taxes this riding contributes.'}
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
