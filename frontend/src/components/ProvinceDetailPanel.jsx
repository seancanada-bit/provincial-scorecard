import { useState } from 'react';
import {
  gradeFill, gradeColorClass, gradeBgClass, scoreFill,
  outlookSymbol, outlookLabel, formatDollars, overrunColor, delayColor,
  PROVINCE_COLORS,
} from '../utils/grading.js';

const TABS = [
  { key: 'healthcare',     label: 'Health',     icon: '🏥' },
  { key: 'housing',        label: 'Housing',    icon: '🏠' },
  { key: 'fiscal',         label: 'Fiscal',     icon: '💰' },
  { key: 'infrastructure', label: 'Infra',      icon: '🏗️' },
  { key: 'economy',        label: 'Economy',    icon: '📈' },
];

function MetricRow({ label, score, rawDisplay, compareDisplay }) {
  if (score === null || score === undefined) return null;
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div className="dp-metric">
      <div className="dp-metric__label">{label}</div>
      <div className="dp-metric__track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="dp-metric__fill" style={{ width: `${pct}%`, background: scoreFill(score) }} />
      </div>
      <div className="dp-metric__meta">
        <span className="dp-metric__raw">{rawDisplay}</span>
        {compareDisplay && <span className="dp-metric__compare">{compareDisplay}</span>}
      </div>
    </div>
  );
}

function KeyStat({ value, unit, label, scoreLabel, score, grade }) {
  return (
    <div className="dp-keystat">
      <div className="dp-keystat__number">
        <span className="dp-keystat__value">{value}</span>
        {unit && <span className="dp-keystat__unit">{unit}</span>}
      </div>
      <div className="dp-keystat__label">{label}</div>
      {score !== null && score !== undefined && (
        <div className={`dp-keystat__grade ${gradeBgClass(grade)} ${gradeColorClass(grade)}`}>
          {grade} · {score}/100
        </div>
      )}
    </div>
  );
}

function HealthTab({ c }) {
  const hc = c.healthcare;
  return (
    <div className="dp-tab-content">
      <KeyStat
        value={hc.surgicalWaitWeeks ?? '—'}
        unit=" wks"
        label="median wait from GP referral to treatment"
        score={hc.score}
        grade={hc.grade}
      />
      <div className="dp-metrics">
        <MetricRow label="Surgical wait time" score={hc.surgicalWaitScore}
          rawDisplay={hc.surgicalWaitWeeks != null ? `${hc.surgicalWaitWeeks} weeks` : '—'}
          compareDisplay="National avg: 27 wks" />
        <MetricRow label="Primary care attachment" score={hc.primaryCareScore}
          rawDisplay={hc.primaryCareAttachPct != null ? `${hc.primaryCareAttachPct}% have a family doctor` : '—'}
          compareDisplay="Best: 100% · Floor: 70%" />
        <MetricRow label="ER wait time benchmark" score={hc.erBenchmarkScore}
          rawDisplay={hc.erBenchmarkMetPct != null ? `${hc.erBenchmarkMetPct}% of visits on time` : '—'}
          compareDisplay="Target: 90% · Floor: 50%" />
      </div>
      {hc.sourceNotes && <p className="dp-source">Source: {hc.sourceNotes}</p>}
    </div>
  );
}

function HousingTab({ c }) {
  const h = c.housing;
  const benchmarkShort = h.mlsHpiBenchmark != null
    ? `$${(h.mlsHpiBenchmark / 1000).toFixed(0)}K`
    : '—';
  return (
    <div className="dp-tab-content">
      <KeyStat
        value={benchmarkShort}
        label={`benchmark home price${h.mlsHpiYoyPct != null ? ` · ${h.mlsHpiYoyPct >= 0 ? '+' : ''}${h.mlsHpiYoyPct}% year-over-year` : ''}`}
        score={h.score}
        grade={h.grade}
      />
      <div className="dp-metrics">
        <MetricRow label="Housing supply" score={h.startsScore}
          rawDisplay={h.housingStartsPer1000Growth != null ? `${h.housingStartsPer1000Growth} starts per 1,000 new residents` : '—'}
          compareDisplay="Target: 300+" />
        <MetricRow label="Home price trend" score={h.priceScore}
          rawDisplay={h.mlsHpiYoyPct != null ? `${h.mlsHpiYoyPct >= 0 ? '+' : ''}${h.mlsHpiYoyPct}% year-over-year` : '—'}
          compareDisplay="Lower = better score" />
        <MetricRow label="Rent inflation" score={h.rentScore}
          rawDisplay={h.rentInflationPct != null ? `Rents up ${h.rentInflationPct}% in past year` : '—'}
          compareDisplay="0% = 100 · 10%+ = 0" />
      </div>
      {h.sourceNotes && <p className="dp-source">Source: {h.sourceNotes}</p>}
    </div>
  );
}

function FiscalTab({ c }) {
  const f = c.fiscal;
  const cents = f.debtInterestCentsPerDollar;
  return (
    <div className="dp-tab-content">
      <KeyStat
        value={cents != null ? `${cents}¢` : '—'}
        label="of every tax dollar goes to debt interest, not services"
        score={f.score}
        grade={f.grade}
      />
      <div className="dp-metrics">
        <MetricRow label="Budget balance" score={f.balanceScore}
          rawDisplay={f.budgetBalancePctGdp != null
            ? `${f.budgetBalancePctGdp >= 0 ? '+' : ''}${f.budgetBalancePctGdp.toFixed(1)}% of GDP`
            : '—'}
          compareDisplay="Surplus >1.5% = best" />
        <MetricRow label="Debt interest burden" score={f.interestScore}
          rawDisplay={cents != null ? `${cents}¢ per tax dollar` : '—'}
          compareDisplay="Under 4¢ = best" />
        <MetricRow label="Net debt per person" score={f.debtScore}
          rawDisplay={f.netDebtPerCapita != null
            ? `$${f.netDebtPerCapita.toLocaleString('en-CA')} per capita`
            : '—'}
          compareDisplay="Under $5K = best" />
      </div>
      {f.fiscalTrend && (
        <div className="dp-trend">
          <span className={`trend-arrow trend-arrow--${f.fiscalTrend === 'improving' ? 'up' : f.fiscalTrend === 'worsening' ? 'down' : 'stable'}`}>
            {f.fiscalTrend === 'improving' ? '↑' : f.fiscalTrend === 'worsening' ? '↓' : '→'}
          </span>
          <span>Fiscal trend {f.fiscalTrend}
            {f.fiscalTrend === 'improving' ? ' (+5 bonus)' : f.fiscalTrend === 'worsening' ? ' (−5 penalty)' : ''}
          </span>
        </div>
      )}
    </div>
  );
}

function InfraTab({ c }) {
  const inf = c.infrastructure;
  return (
    <div className="dp-tab-content">
      <KeyStat
        value={inf.avgOverrunPct != null ? `+${inf.avgOverrunPct}%` : '—'}
        label={`avg cost overrun · ${inf.avgDelayMonths ?? '—'} months average delay`}
        score={inf.score}
        grade={inf.grade}
      />
      {inf.projects?.length > 0 && (
        <div className="dp-infra-table-wrap">
          <table className="dp-infra-table" aria-label="Major capital projects">
            <thead>
              <tr>
                <th>Project</th>
                <th>Budget</th>
                <th>Overrun</th>
                <th>Delay</th>
              </tr>
            </thead>
            <tbody>
              {inf.projects.map((p, i) => (
                <tr key={i}>
                  <td>
                    <div className="dp-infra-name">{p.name}</div>
                    <div className="dp-infra-type">{p.type}</div>
                  </td>
                  <td className="dp-infra-budget">
                    <span style={{ color: p.overrunPct > 5 ? overrunColor(p.overrunPct) : 'var(--text-primary)' }}>
                      {p.currentBudget >= 1e9
                        ? `$${(p.currentBudget / 1e9).toFixed(1)}B`
                        : `$${(p.currentBudget / 1e6).toFixed(0)}M`}
                    </span>
                  </td>
                  <td>
                    <span className={`dp-badge dp-badge--${p.overrunPct <= 5 ? 'green' : p.overrunPct <= 20 ? 'amber' : 'red'}`}>
                      {p.overrunPct > 0 ? `+${p.overrunPct.toFixed(0)}%` : '✓'}
                    </span>
                  </td>
                  <td>
                    <span className={`dp-badge dp-badge--${p.monthsDelayed <= 3 ? 'green' : p.monthsDelayed <= 12 ? 'amber' : 'red'}`}>
                      {p.monthsDelayed === 0 ? '✓' : `+${p.monthsDelayed}mo`}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EconomyTab({ c }) {
  const e = c.economy;
  return (
    <div className="dp-tab-content">
      <KeyStat
        value={e.unemploymentRate != null ? `${e.unemploymentRate}%` : '—'}
        label={`unemployment rate${e.unemploymentDeltaFromNational != null
          ? ` · ${e.unemploymentDeltaFromNational >= 0 ? '+' : ''}${e.unemploymentDeltaFromNational}% vs national avg`
          : ''}`}
        score={e.score}
        grade={e.grade}
      />
      <div className="dp-metrics">
        <MetricRow label="Employment vs. national" score={e.unemployScore}
          rawDisplay={e.unemploymentRate != null ? `${e.unemploymentRate}% unemployment` : '—'} />
        <MetricRow label="GDP growth vs. national" score={e.gdpGrowthScore}
          rawDisplay={e.gdpGrowthPct != null ? `${e.gdpGrowthPct}% GDP growth` : '—'} />
      </div>

      {e.credit && (
        <div className="dp-credit">
          <div className="dp-section-label">Credit ratings</div>
          <div className="dp-credit-badges">
            {Object.entries({ "Moody's": e.credit.moodys, 'DBRS': e.credit.dbrs, 'S&P': e.credit.sp, 'Fitch': e.credit.fitch })
              .filter(([, v]) => v?.rating)
              .map(([agency, v]) => (
                <div key={agency} className="dp-credit-badge" aria-label={`${agency}: ${v.rating} ${outlookLabel(v.outlook)}`}>
                  <span className="dp-credit-agency">{agency}</span>
                  <span className="dp-credit-rating">{v.rating}</span>
                  <span className="dp-credit-outlook" title={outlookLabel(v.outlook)}>{outlookSymbol(v.outlook)}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="dp-gov-row">
        {e.agOpinion && (
          <div>
            <div className="dp-section-label">Auditor General {e.agYear ? `(${e.agYear})` : ''}</div>
            <span className={`ag-chip ag-chip--${e.agOpinion.toLowerCase()}`}>
              {e.agOpinion === 'clean' && '✓ Clean opinion'}
              {e.agOpinion === 'qualified' && '⚠ Qualified opinion'}
              {e.agOpinion === 'adverse' && '✗ Adverse opinion'}
            </span>
          </div>
        )}
        {e.premierApprovalPct != null && (
          <div>
            <div className="dp-section-label">Premier approval</div>
            <div className="dp-approval-bar">
              <div className="dp-approval-bar__approve" style={{ width: `${e.premierApprovalPct}%` }} />
              <div className="dp-approval-bar__neutral"  style={{ width: `${Math.max(0, 100 - e.premierApprovalPct - e.premierDisapprovalPct)}%` }} />
              <div className="dp-approval-bar__disapprove" style={{ width: `${e.premierDisapprovalPct}%` }} />
            </div>
            <div className="dp-approval-labels">
              <span style={{ color: 'var(--grade-b)' }}>{e.premierApprovalPct}% approve</span>
              <span style={{ color: 'var(--grade-d)' }}>{e.premierDisapprovalPct}% disapprove</span>
            </div>
            {e.pollSourceNotes && <p className="dp-source">{e.pollSourceNotes}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProvinceDetailPanel({ province, onMethodology, initialTab }) {
  const [activeTab, setActiveTab] = useState(initialTab ?? 'healthcare');
  const c = province.categories;
  const color = PROVINCE_COLORS[province.code] ?? '#333';

  const tabScore = key => c[key]?.score ?? 0;
  const tabGrade = key => c[key]?.grade ?? '—';

  return (
    <div className="dp-panel">
      {/* Header */}
      <div className="dp-header" style={{ borderTop: `4px solid ${color}` }}>
        <div className="dp-header__left">
          <div className="dp-header__badge" style={{ background: color }}>{province.code}</div>
          <div>
            <div className="dp-header__name">{province.name}</div>
            <div className="dp-header__premier">{province.premierName}</div>
          </div>
        </div>
        <div className="dp-header__right">
          <span className={`dp-header__grade ${gradeColorClass(province.grade)}`}>{province.grade}</span>
          <span className="dp-header__score">{province.composite}<span style={{fontSize:13,opacity:.6}}>/100</span></span>
        </div>
      </div>

      {/* Tabs */}
      <div className="dp-tabs" role="tablist">
        {TABS.map(tab => {
          const score = tabScore(tab.key);
          const grade = tabGrade(tab.key);
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              className={`dp-tab${activeTab === tab.key ? ' dp-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
              style={{ '--tab-color': gradeFill(grade) }}
            >
              <span className="dp-tab__icon" aria-hidden="true">{tab.icon}</span>
              <span className="dp-tab__label">{tab.label}</span>
              <span className="dp-tab__score" style={{ color: gradeFill(grade) }}>{score}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div role="tabpanel">
        {activeTab === 'healthcare'     && <HealthTab c={c} />}
        {activeTab === 'housing'        && <HousingTab c={c} />}
        {activeTab === 'fiscal'         && <FiscalTab c={c} />}
        {activeTab === 'infrastructure' && <InfraTab c={c} />}
        {activeTab === 'economy'        && <EconomyTab c={c} />}
      </div>

      {/* Composite + methodology */}
      <div className="dp-composite">
        <div className="dp-section-label" style={{ marginBottom: 10 }}>Score breakdown (weighted)</div>
        {TABS.map(tab => (
          <div key={tab.key} className="dp-composite__row">
            <span className="dp-composite__name">{tab.label}</span>
            <div className="dp-composite__track">
              <div className="dp-composite__fill" style={{ width: `${tabScore(tab.key)}%`, background: gradeFill(tabGrade(tab.key)) }} />
            </div>
            <span className="dp-composite__score">{tabScore(tab.key)}</span>
          </div>
        ))}
        <div style={{ marginTop: 12, textAlign: 'right' }}>
          <button className="methodology-link" onClick={onMethodology}>ℹ How we score this</button>
        </div>
      </div>
    </div>
  );
}
