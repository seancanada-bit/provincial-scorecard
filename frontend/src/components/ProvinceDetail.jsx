import {
  gradeFill, scoreFill, gradeColorClass, gradeBgClass,
  outlookSymbol, outlookLabel, formatDollars, formatDollarsShort,
  overrunColor, delayColor,
} from '../utils/grading.js';

function MetricRow({ label, score, rawDisplay, compareDisplay, fill }) {
  if (score === null || score === undefined) return null;
  const pct = Math.max(0, Math.min(100, score));
  const barColor = fill ?? scoreFill(score);
  return (
    <div className="metric-row">
      <div className="metric-row__label">{label}</div>
      <div className="metric-row__track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="metric-row__fill" style={{ width: `${pct}%`, background: barColor }} />
      </div>
      <div className="metric-row__meta">
        <span className="metric-row__raw">{rawDisplay} — {score}/100</span>
        {compareDisplay && <span className="metric-row__compare">{compareDisplay}</span>}
      </div>
    </div>
  );
}

function SectionHeader({ icon, title, score, grade }) {
  return (
    <div className="detail-section__header">
      <span className="detail-section__title">
        <span aria-hidden="true">{icon}</span> {title}
        <span className="detail-section__score">{score}/100</span>
      </span>
      <span className={`detail-section__grade-chip ${gradeBgClass(grade)} ${gradeColorClass(grade)}`}>
        {grade}
      </span>
    </div>
  );
}

export default function ProvinceDetail({ province, onMethodology }) {
  const { categories: c } = province;

  return (
    <div className="province-detail">
      {/* ── HEALTHCARE ─────────────────────────────────────────────── */}
      <section className="detail-section" aria-labelledby={`hc-${province.code}`}>
        <SectionHeader icon="🏥" title="Healthcare Delivery" score={c.healthcare.score} grade={c.healthcare.grade} />
        <MetricRow
          label="Surgical wait time"
          score={c.healthcare.surgicalWaitScore}
          rawDisplay={c.healthcare.surgicalWaitWeeks != null ? `${c.healthcare.surgicalWaitWeeks} weeks from referral to treatment` : '—'}
          compareDisplay="National avg: 27 weeks"
        />
        <MetricRow
          label="Primary care attachment"
          score={c.healthcare.primaryCareScore}
          rawDisplay={c.healthcare.primaryCareAttachPct != null ? `${c.healthcare.primaryCareAttachPct}% of adults have a family doctor or primary care provider` : '—'}
          compareDisplay="Best: 100% · Baseline: 70%"
        />
        <MetricRow
          label="ER wait time benchmark"
          score={c.healthcare.erBenchmarkScore}
          rawDisplay={c.healthcare.erBenchmarkMetPct != null ? `${c.healthcare.erBenchmarkMetPct}% of ER visits seen within the recommended time` : '—'}
          compareDisplay="Target: 90% · Min: 50%"
        />
        {c.healthcare.sourceNotes && (
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Sources: {c.healthcare.sourceNotes}
          </p>
        )}
      </section>

      {/* ── HOUSING ────────────────────────────────────────────────── */}
      <section className="detail-section" aria-labelledby={`ho-${province.code}`}>
        <SectionHeader icon="🏠" title="Housing & Affordability" score={c.housing.score} grade={c.housing.grade} />
        <MetricRow
          label="Housing supply effort"
          score={c.housing.startsScore}
          rawDisplay={c.housing.housingStartsPer1000Growth != null ? `${c.housing.housingStartsPer1000Growth} new homes started per 1,000 new residents` : '—'}
          compareDisplay="Target: 300+ · Min: 50"
        />
        <MetricRow
          label="Home price trend"
          score={c.housing.priceScore}
          rawDisplay={c.housing.mlsHpiBenchmark != null
            ? `Benchmark price: ${formatDollars(c.housing.mlsHpiBenchmark)} (${c.housing.mlsHpiYoyPct >= 0 ? '+' : ''}${c.housing.mlsHpiYoyPct}% year-over-year)`
            : '—'}
          compareDisplay="Lower growth = better score"
        />
        <MetricRow
          label="Rental affordability"
          score={c.housing.rentScore}
          rawDisplay={c.housing.rentInflationPct != null ? `Rents rose ${c.housing.rentInflationPct}% in the past year` : '—'}
          compareDisplay="0% inflation = 100 · 10%+ = 0"
        />
        {c.housing.sourceNotes && (
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Sources: {c.housing.sourceNotes}
          </p>
        )}
      </section>

      {/* ── FISCAL ─────────────────────────────────────────────────── */}
      <section className="detail-section" aria-labelledby={`fi-${province.code}`}>
        <SectionHeader icon="💰" title="Fiscal Responsibility" score={c.fiscal.score} grade={c.fiscal.grade} />
        <MetricRow
          label="Budget balance"
          score={c.fiscal.balanceScore}
          rawDisplay={c.fiscal.budgetBalancePctGdp != null
            ? `Running a ${c.fiscal.budgetBalancePctGdp >= 0 ? c.fiscal.budgetBalancePctGdp.toFixed(1) + '% surplus' : Math.abs(c.fiscal.budgetBalancePctGdp).toFixed(1) + '% deficit'} relative to the size of its economy`
            : '—'}
          compareDisplay="Surplus >1.5% = 100 · Deficit >5% = 0"
        />
        <MetricRow
          label="Debt interest burden"
          score={c.fiscal.interestScore}
          rawDisplay={c.fiscal.debtInterestCentsPerDollar != null
            ? `${c.fiscal.debtInterestCentsPerDollar}¢ of every tax dollar goes to paying debt interest instead of services`
            : '—'}
          compareDisplay="Under 4¢ = best · Over 15¢ = worst"
        />
        <MetricRow
          label="Net debt per person"
          score={c.fiscal.debtScore}
          rawDisplay={c.fiscal.netDebtPerCapita != null
            ? `Each person's share of provincial debt: $${c.fiscal.netDebtPerCapita.toLocaleString('en-CA')}`
            : '—'}
          compareDisplay="Under $5K = best · Over $40K = worst"
        />
        {c.fiscal.fiscalTrend && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            <span aria-label={`Fiscal trend: ${c.fiscal.fiscalTrend}`}>
              {c.fiscal.fiscalTrend === 'improving' && <span className="trend-arrow trend-arrow--up">↑</span>}
              {c.fiscal.fiscalTrend === 'worsening' && <span className="trend-arrow trend-arrow--down">↓</span>}
              {c.fiscal.fiscalTrend === 'stable'    && <span className="trend-arrow trend-arrow--stable">→</span>}
            </span>
            <span>
              {c.fiscal.fiscalTrend === 'improving' && 'Fiscal position improving over three years (+5 bonus)'}
              {c.fiscal.fiscalTrend === 'worsening' && 'Fiscal position worsening over three years (−5 penalty)'}
              {c.fiscal.fiscalTrend === 'stable'    && 'Fiscal position stable over three years'}
            </span>
          </div>
        )}
      </section>

      {/* ── INFRASTRUCTURE ─────────────────────────────────────────── */}
      <section className="detail-section" aria-labelledby={`in-${province.code}`}>
        <SectionHeader icon="🏗️" title="Infrastructure Delivery" score={c.infrastructure.score} grade={c.infrastructure.grade} />
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
          {c.infrastructure.avgOverrunPct != null
            ? `Average cost overrun across major projects: ${c.infrastructure.avgOverrunPct}%. Average delay: ${c.infrastructure.avgDelayMonths} months.`
            : 'Infrastructure data not yet available for this province.'}
        </p>
        {c.infrastructure.projects?.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="infra-table" aria-label="Major capital projects">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Budget</th>
                  <th>Overrun</th>
                  <th>Delay</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {c.infrastructure.projects.map((p, i) => (
                  <tr key={i}>
                    <td>
                      <div className="infra-table__name">{p.name}</div>
                      <div className="infra-table__type">{p.type}</div>
                    </td>
                    <td>
                      <div className="budget-badge" style={{ color: p.overrunPct > 5 ? overrunColor(p.overrunPct) : 'var(--text-primary)' }}>
                        {formatDollarsShort(p.currentBudget)}
                      </div>
                      {p.overrunPct > 0 && (
                        <div style={{ fontSize: '10px', color: overrunColor(p.overrunPct) }}>
                          orig. {formatDollarsShort(p.originalBudget)}
                        </div>
                      )}
                    </td>
                    <td>
                      <span
                        className={`status-chip status-chip--${p.overrunPct <= 5 ? 'green' : p.overrunPct <= 20 ? 'amber' : 'red'}`}
                        aria-label={`${p.overrunPct}% over original budget`}
                      >
                        {p.overrunPct > 0 ? `+${p.overrunPct.toFixed(0)}%` : 'On budget'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`status-chip status-chip--${p.monthsDelayed <= 3 ? 'green' : p.monthsDelayed <= 12 ? 'amber' : 'red'}`}
                        aria-label={`${p.monthsDelayed} months delayed`}
                      >
                        {p.monthsDelayed === 0 ? 'On time' : `+${p.monthsDelayed}mo`}
                      </span>
                    </td>
                    <td style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '100px' }}>
                      {p.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── ECONOMY & GOVERNANCE ───────────────────────────────────── */}
      <section className="detail-section" aria-labelledby={`ec-${province.code}`}>
        <SectionHeader icon="📈" title="Economy & Governance" score={c.economy.score} grade={c.economy.grade} />

        {/* Employment */}
        <MetricRow
          label="Unemployment vs. national average"
          score={c.economy.unemployScore}
          rawDisplay={c.economy.unemploymentRate != null
            ? `${c.economy.unemploymentRate}% unemployment rate${c.economy.unemploymentDeltaFromNational != null ? ` (${c.economy.unemploymentDeltaFromNational >= 0 ? '+' : ''}${c.economy.unemploymentDeltaFromNational}% vs national)` : ''}`
            : '—'}
        />
        <MetricRow
          label="GDP growth vs. national average"
          score={c.economy.gdpGrowthScore}
          rawDisplay={c.economy.gdpGrowthPct != null
            ? `${c.economy.gdpGrowthPct}% GDP growth${c.economy.gdpGrowthDeltaFromNational != null ? ` (${c.economy.gdpGrowthDeltaFromNational >= 0 ? '+' : ''}${c.economy.gdpGrowthDeltaFromNational}% vs national)` : ''}`
            : '—'}
        />

        {/* Credit ratings */}
        {c.economy.credit && (
          <div className="metric-row">
            <div className="metric-row__label">Credit ratings</div>
            <div className="credit-badges" role="list" aria-label="Credit agency ratings">
              {Object.entries({
                "Moody's": c.economy.credit.moodys,
                'DBRS':    c.economy.credit.dbrs,
                'S&P':     c.economy.credit.sp,
                'Fitch':   c.economy.credit.fitch,
              }).filter(([, v]) => v?.rating).map(([agency, v]) => (
                <div key={agency} className="credit-badge" role="listitem" aria-label={`${agency}: ${v.rating} ${outlookLabel(v.outlook)}`}>
                  <span className="credit-badge__agency">{agency}</span>
                  <span className="credit-badge__rating">{v.rating}</span>
                  <span className="credit-badge__outlook" title={outlookLabel(v.outlook)}>
                    {outlookSymbol(v.outlook)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Auditor General */}
        {c.economy.agOpinion && (
          <div className="metric-row">
            <div className="metric-row__label">Auditor General opinion {c.economy.agYear ? `(${c.economy.agYear})` : ''}</div>
            <span
              className={`ag-chip ag-chip--${c.economy.agOpinion.toLowerCase()}`}
              aria-label={`Auditor General opinion: ${c.economy.agOpinion}`}
            >
              {c.economy.agOpinion === 'clean'     && '✓ Clean opinion'}
              {c.economy.agOpinion === 'qualified' && '⚠ Qualified opinion'}
              {c.economy.agOpinion === 'adverse'   && '✗ Adverse opinion'}
            </span>
          </div>
        )}

        {/* Premier approval */}
        {c.economy.premierApprovalPct != null && (
          <div className="metric-row">
            <div className="metric-row__label">Premier approval</div>
            <div className="approval-bar" role="img" aria-label={`${c.economy.premierApprovalPct}% approve, ${c.economy.premierDisapprovalPct}% disapprove`}>
              <div className="approval-bar__approve" style={{ width: `${c.economy.premierApprovalPct}%` }} />
              <div className="approval-bar__neutral"  style={{ width: `${Math.max(0, 100 - c.economy.premierApprovalPct - c.economy.premierDisapprovalPct)}%` }} />
              <div className="approval-bar__disapprove" style={{ width: `${c.economy.premierDisapprovalPct}%` }} />
            </div>
            <div className="approval-bar__labels">
              <span style={{ color: 'var(--grade-b)' }}>Approve {c.economy.premierApprovalPct}%</span>
              <span style={{ color: 'var(--grade-d)' }}>Disapprove {c.economy.premierDisapprovalPct}%</span>
            </div>
            {c.economy.pollSourceNotes && (
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{c.economy.pollSourceNotes}</p>
            )}
          </div>
        )}
      </section>

      {/* ── COMPOSITE BREAKDOWN ────────────────────────────────────── */}
      <section className="detail-section" aria-label="Composite score breakdown">
        <div className="detail-section__header">
          <span className="detail-section__title">Composite score breakdown</span>
        </div>
        <div className="composite-bar">
          <p className="composite-bar__label">How each category contributed to the overall score (weighted)</p>
          {[
            { key: 'healthcare',     label: 'Healthcare',     weight: 25, score: c.healthcare.score },
            { key: 'housing',        label: 'Housing',        weight: 20, score: c.housing.score },
            { key: 'fiscal',         label: 'Fiscal',         weight: 20, score: c.fiscal.score },
            { key: 'infrastructure', label: 'Infrastructure', weight: 15, score: c.infrastructure.score },
            { key: 'economy',        label: 'Economy',        weight: 20, score: c.economy.score },
          ].map(({ key, label, weight, score }) => (
            <div key={key} className="composite-bar__row">
              <span className="composite-bar__name">{label} ({weight}%)</span>
              <div className="composite-bar__track">
                <div
                  className="composite-bar__fill"
                  style={{ width: `${score}%`, background: gradeFill(c[key]?.grade) }}
                />
              </div>
              <span className="composite-bar__score">{score}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="methodology-link" onClick={onMethodology} aria-haspopup="dialog">
            ℹ How we score this
          </button>
        </div>
      </section>
    </div>
  );
}
