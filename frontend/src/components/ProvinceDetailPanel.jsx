import { useState, useRef, useEffect } from 'react';
import {
  gradeFill, gradeColorClass, gradeBgClass, scoreFill,
  outlookSymbol, outlookLabel, formatDollars, overrunColor, delayColor,
  PROVINCE_COLORS, PROVINCE_FLAGS, FLAG_POSITIONS,
} from '../utils/grading.js';

const TABS = [
  { key: 'healthcare',     label: 'Health',     icon: '🏥' },
  { key: 'housing',        label: 'Housing',    icon: '🏠' },
  { key: 'fiscal',         label: 'Fiscal',     icon: '💰' },
  { key: 'infrastructure', label: 'Infra',      icon: '🏗️' },
  { key: 'economy',        label: 'Economy',    icon: '📈' },
  { key: 'education',      label: 'Education',  icon: '🎓' },
  { key: 'safety',         label: 'Safety',       icon: '🛡️' },
  { key: 'mentalhealth',   label: 'Mental Health', icon: '🧠' },
  { key: 'purchasing',     label: 'Buying Power', icon: '🛒' },
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

function FiscalTab({ c, taxes }) {
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

      {/* ── What you pay ── */}
      {taxes && (
        <div className="dp-your-money">
          <div className="dp-section-label" style={{ marginBottom: 12 }}>What a typical household pays this province</div>
          <div className="dp-money-grid">
            <div className="dp-money-cell">
              <div className="dp-money-cell__value">
                {taxes.incomeEffectiveRatePct != null ? `${taxes.incomeEffectiveRatePct}%` : '—'}
              </div>
              <div className="dp-money-cell__label">Provincial income tax<br/><span className="dp-money-cell__sub">effective rate at $60K income</span></div>
            </div>
            <div className="dp-money-cell">
              <div className="dp-money-cell__value">
                {taxes.salesTaxPct != null
                  ? taxes.salesTaxPct === 0 ? 'None' : `${taxes.salesTaxPct}%`
                  : '—'}
              </div>
              <div className="dp-money-cell__label">
                {taxes.hasHst ? 'HST' : taxes.salesTaxPct === 0 ? 'No provincial sales tax' : 'Provincial sales tax (PST)'}
                {taxes.salesTaxPct === 0 && <><br/><span className="dp-money-cell__sub highlight-good">Only 5% federal GST applies</span></>}
              </div>
            </div>
            <div className="dp-money-cell">
              <div className="dp-money-cell__value">
                {taxes.childcareMonthlyAvg != null
                  ? `$${taxes.childcareMonthlyAvg.toLocaleString('en-CA')}`
                  : '—'}
              </div>
              <div className="dp-money-cell__label">Regulated childcare<br/><span className="dp-money-cell__sub">avg monthly cost, toddler age</span></div>
            </div>
            <div className="dp-money-cell">
              <div className="dp-money-cell__value">
                {taxes.legislatureCostPerCapita != null ? `$${taxes.legislatureCostPerCapita}` : '—'}
              </div>
              <div className="dp-money-cell__label">Legislature cost<br/><span className="dp-money-cell__sub">per resident per year</span></div>
            </div>
            <div className="dp-money-cell">
              <div className="dp-money-cell__value">
                {taxes.publicSectorPer1000 != null ? taxes.publicSectorPer1000 : '—'}
              </div>
              <div className="dp-money-cell__label">Public sector workers<br/><span className="dp-money-cell__sub">per 1,000 residents</span></div>
            </div>
            <div className="dp-money-cell dp-money-cell--highlight">
              <div className="dp-money-cell__value dp-money-cell__value--index">
                {taxes.taxBurdenIndex != null ? taxes.taxBurdenIndex : '—'}
              </div>
              <div className="dp-money-cell__label">Tax burden index<br/><span className="dp-money-cell__sub">100 = national average</span></div>
            </div>
          </div>
          {taxes.sourceNotes && <p className="dp-source">{taxes.sourceNotes}</p>}
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

      {e.childcareMonthlyAvg != null && (
        <div className="dp-metrics" style={{ marginTop: 16 }}>
          <div className="dp-section-label" style={{ marginBottom: 8 }}>Childcare affordability</div>
          <MetricRow
            label="Regulated childcare cost"
            score={e.childcareScore}
            rawDisplay={`$${e.childcareMonthlyAvg.toLocaleString('en-CA')}/mo avg`}
            compareDisplay="QC $196 · ON $1,456 · Affects labour force participation" />
          <p className="dp-source" style={{ marginTop: 6 }}>
            Weighted 15% of economy score — high costs reduce workforce participation, especially for women.
            Note: federal cost-sharing (2021 deal) means this partly reflects federal policy, not solely provincial.
          </p>
        </div>
      )}
    </div>
  );
}

function EducationTab({ c }) {
  const ed = c.education;
  if (!ed) return <div className="dp-tab-content"><p className="dp-source">Education data not yet available.</p></div>;
  return (
    <div className="dp-tab-content">
      <KeyStat
        value={ed.pcapMathScore ?? '—'}
        label={`PCAP math score (national avg ~490) · Reading: ${ed.pcapReadingScore ?? '—'}`}
        score={ed.score}
        grade={ed.grade}
      />
      <div className="dp-metrics">
        <MetricRow label="Math outcomes (PCAP)" score={ed.pcapScore}
          rawDisplay={ed.pcapMathScore != null ? `${ed.pcapMathScore} / 600` : '—'}
          compareDisplay="QC: 531 · National avg: ~490" />
        <MetricRow label="University tuition affordability" score={ed.tuitionScore}
          rawDisplay={ed.avgUniversityTuition != null ? `$${ed.avgUniversityTuition.toLocaleString('en-CA')}/yr avg undergrad` : '—'}
          compareDisplay="QC: $3,013 · ON: $9,070" />
      </div>

      <div className="dp-your-money" style={{ marginTop: 16 }}>
        <div className="dp-section-label" style={{ marginBottom: 12 }}>Education system inputs</div>
        <div className="dp-money-grid">
          <div className="dp-money-cell">
            <div className="dp-money-cell__value">
              {ed.perPupilSpending != null ? `$${(ed.perPupilSpending / 1000).toFixed(0)}K` : '—'}
            </div>
            <div className="dp-money-cell__label">Per-pupil spending<br/><span className="dp-money-cell__sub">annual K–12 expenditure</span></div>
          </div>
          <div className="dp-money-cell">
            <div className="dp-money-cell__value">
              {ed.studentTeacherRatio != null ? `${ed.studentTeacherRatio}:1` : '—'}
            </div>
            <div className="dp-money-cell__label">Student–teacher ratio<br/><span className="dp-money-cell__sub">lower = more resources</span></div>
          </div>
          <div className="dp-money-cell">
            <div className="dp-money-cell__value">
              {ed.avgUniversityTuition != null ? `$${ed.avgUniversityTuition.toLocaleString('en-CA')}` : '—'}
            </div>
            <div className="dp-money-cell__label">Avg undergrad tuition<br/><span className="dp-money-cell__sub">annual, domestic student</span></div>
          </div>
        </div>
      </div>

      {ed.sourceNotes && <p className="dp-source">Source: {ed.sourceNotes}</p>}
    </div>
  );
}

function SafetyTab({ c }) {
  const s = c.safety;
  if (!s) return <div className="dp-tab-content"><p className="dp-source">Safety data not yet available.</p></div>;
  return (
    <div className="dp-tab-content">
      <KeyStat
        value={s.homicideRatePer100k != null ? s.homicideRatePer100k.toFixed(2) : '—'}
        unit=" per 100k"
        label="homicide rate — most reliably reported crime (always counted)"
        score={s.score}
        grade={s.grade}
      />
      <div className="dp-metrics">
        <MetricRow label="Victimization rate (GSS survey)" score={s.victimizationScore}
          rawDisplay={s.victimizationRatePer1000 != null ? `${s.victimizationRatePer1000} per 1,000 residents` : '—'}
          compareDisplay="Self-reported — not police data · National avg: ~101" />
        <MetricRow label="Homicide rate" score={s.homicideScore}
          rawDisplay={s.homicideRatePer100k != null ? `${s.homicideRatePer100k.toFixed(2)} per 100,000 residents` : '—'}
          compareDisplay="National avg: ~1.9 · Best: PE 0.58" />
      </div>
      <p className="dp-source" style={{ marginTop: 8 }}>
        Uses survey-based data to avoid reporting bias — crime statistics based on police reports
        undercount incidents as public confidence in reporting declines.
      </p>
      {s.sourceNotes && <p className="dp-source">Source: {s.sourceNotes}</p>}
    </div>
  );
}

function MentalHealthTab({ c }) {
  const mh = c.mentalhealth;
  if (!mh) return <div className="dp-tab-content"><p className="dp-source">Mental health data not yet available.</p></div>;
  return (
    <div className="dp-tab-content">
      <KeyStat
        value={mh.drugToxicityRatePer100k != null ? mh.drugToxicityRatePer100k.toFixed(1) : '—'}
        unit=" per 100k"
        label="apparent opioid & stimulant toxicity death rate — primary crisis indicator"
        score={mh.score}
        grade={mh.grade}
      />
      <div className="dp-metrics">
        <MetricRow label="Drug toxicity death rate" score={mh.drugToxicityScore}
          rawDisplay={mh.drugToxicityRatePer100k != null ? `${mh.drugToxicityRatePer100k.toFixed(1)} per 100,000 residents` : '—'}
          compareDisplay="BC: 38.0 · QC: 4.1 · Lower = better score" />
        <MetricRow label="Psychiatric beds" score={mh.psychiatricBedsScore}
          rawDisplay={mh.psychiatricBedsPer100k != null ? `${mh.psychiatricBedsPer100k} beds per 100,000 residents` : '—'}
          compareDisplay="QC: 83 · ON: 25 · Target: 60+" />
        <MetricRow label="Mental health budget share" score={mh.mhBudgetScore}
          rawDisplay={mh.mentalHealthBudgetPct != null ? `${mh.mentalHealthBudgetPct}% of health budget` : '—'}
          compareDisplay="QC: 9.0% · PE: 6.5% · Target: 10%+" />
        <MetricRow label="Addiction recovery beds" score={mh.recoveryBedsScore}
          rawDisplay={mh.recoveryBedsPer100k != null ? `${mh.recoveryBedsPer100k} beds per 100,000 residents` : '—'}
          compareDisplay="BC: 45 · NB: 15 · Target: 50+" />
      </div>
      <p className="dp-source" style={{ marginTop: 8 }}>
        Weighted: drug toxicity deaths 35% · psychiatric beds 25% · MH budget share 25% · recovery beds 15%.
        Data: 2022–2023. Drug toxicity figures from PHAC; beds and budget from CIHI provincial profiles.
      </p>
      {mh.sourceNotes && <p className="dp-source">Source: {mh.sourceNotes}</p>}
    </div>
  );
}

function PurchasingPowerTab({ province }) {
  const pp = province.purchasingPower;
  const taxes = province.taxes;
  if (!pp || pp.score === null) return (
    <div className="dp-tab-content"><p className="dp-source">Purchasing power data not yet available.</p></div>
  );
  return (
    <div className="dp-tab-content">
      <KeyStat
        value={pp.rentToIncomePct != null ? `${pp.rentToIncomePct}%` : '—'}
        label="of median household income spent on rent — biggest driver of purchasing power"
        score={pp.score}
        grade={pp.grade}
      />
      <div className="dp-metrics">
        <MetricRow label="Rent-to-income ratio" score={pp.rentScore}
          rawDisplay={pp.rentToIncomePct != null ? `${pp.rentToIncomePct}% of household income` : '—'}
          compareDisplay="Best: ~12% · Worst: ~28% · Lower = more disposable income" />
        <MetricRow label="Grocery basket cost" score={pp.groceryScore}
          rawDisplay={pp.groceryIndex != null ? `Index ${pp.groceryIndex} (national avg = 100)` : '—'}
          compareDisplay="Atlantic provinces pay 6–12% above national avg due to freight" />
        <MetricRow label="Annual energy costs" score={pp.energyScore}
          rawDisplay={pp.annualEnergyCost != null ? `$${pp.annualEnergyCost.toLocaleString('en-CA')}/yr` : '—'}
          compareDisplay="Electricity + heating · QC hydro cheapest · NS/PE oil heat costliest" />
        <MetricRow label="Auto insurance" score={pp.insuranceScore}
          rawDisplay={pp.autoInsuranceAnnual != null ? `$${pp.autoInsuranceAnnual.toLocaleString('en-CA')}/yr avg` : '—'}
          compareDisplay="QC public system ~$717 · AB private market ~$1,952" />
        <MetricRow label="Regulated childcare" score={pp.childcareScore}
          rawDisplay={pp.childcareMonthlyAvg != null ? `$${pp.childcareMonthlyAvg.toLocaleString('en-CA')}/mo` : '—'}
          compareDisplay="QC $196/mo · ON $1,456/mo — largest gap of any cost category" />
      </div>
      <p className="dp-source" style={{ marginTop: 8 }}>
        Purchasing power reflects structural cost environment, not government performance — some factors
        (freight costs, climate, insurance regulation model) are outside provincial control.
      </p>
      {pp.sourceNotes && <p className="dp-source">Sources: {pp.sourceNotes}</p>}
    </div>
  );
}

export default function ProvinceDetailPanel({ province, onMethodology, initialTab }) {
  const [activeTab, setActiveTab] = useState(initialTab ?? 'healthcare');
  const [showValueTip, setShowValueTip] = useState(false);
  const valueBadgeRef = useRef(null);
  const c    = province.categories;
  const taxes = province.taxes ?? null;
  const color = PROVINCE_COLORS[province.code] ?? '#333';

  // Close value tooltip on outside click
  useEffect(() => {
    if (!showValueTip) return;
    const handler = e => {
      if (!valueBadgeRef.current?.contains(e.target)) setShowValueTip(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showValueTip]);

  const tabScore = key => c[key]?.score ?? 0;
  const tabGrade = key => c[key]?.grade ?? '—';

  return (
    <div className="dp-panel">
      {/* Header — flag banner background */}
      <div
        className="dp-header"
        style={{
          borderTop: `4px solid ${color}`,
          '--flag-url': `url(${PROVINCE_FLAGS[province.code] ?? ''})`,
        }}
      >
        {PROVINCE_FLAGS[province.code] && (
          <div className="dp-header__flag-bg" aria-hidden="true" />
        )}
        <div className="dp-header__left">
          <div className="dp-header__badge" style={{ borderColor: color }}>
            <img
              src={PROVINCE_FLAGS[province.code]}
              alt=""
              className="dp-header__flag-img"
              style={{ objectPosition: FLAG_POSITIONS[province.code] ?? 'center' }}
              onError={e => {
                e.target.style.display = 'none';
                e.target.parentNode.style.background = color;
                e.target.parentNode.style.color = '#fff';
                e.target.parentNode.textContent = province.code;
              }}
            />
          </div>
          <div>
            <div className="dp-header__name">{province.name}</div>
            <div className="dp-header__premier">{province.premierName}</div>
          </div>
        </div>
        <div className="dp-header__right">
          <span className={`dp-header__grade ${gradeColorClass(province.grade)}`}>{province.grade}</span>
          <span className="dp-header__score">{province.composite}<span style={{fontSize:13,opacity:.6}}>/100</span></span>
          {province.valueScore != null && (
            <span
              ref={valueBadgeRef}
              className={`dp-header__value${showValueTip ? ' dp-header__value--open' : ''}`}
              onClick={() => setShowValueTip(v => !v)}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setShowValueTip(v => !v)}
              role="button"
              tabIndex={0}
              aria-expanded={showValueTip}
              aria-label={`Value score ${province.valueScore}. Click for explanation.`}
            >
              <span className="dp-header__value-label">$ Value</span>
              <span className="dp-header__value-num">{province.valueScore}</span>
            </span>
          )}
        </div>
      </div>

      {/* Value score explanation bar */}
      {showValueTip && (
        <div className="dp-value-tip" role="status">
          <span><strong>$ Value score</strong> — overall score ÷ tax burden. Who gives you the most for your dollar?</span>
          <button className="dp-value-tip__close" onClick={() => setShowValueTip(false)} aria-label="Close">✕</button>
        </div>
      )}

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
        {activeTab === 'fiscal'         && <FiscalTab c={c} taxes={taxes} />}
        {activeTab === 'infrastructure' && <InfraTab c={c} />}
        {activeTab === 'economy'        && <EconomyTab c={c} />}
        {activeTab === 'education'      && <EducationTab c={c} />}
        {activeTab === 'safety'         && <SafetyTab c={c} />}
        {activeTab === 'mentalhealth'   && <MentalHealthTab c={c} />}
        {activeTab === 'purchasing'     && <PurchasingPowerTab province={province} />}
      </div>

      {/* Composite + methodology */}
      <div className="dp-composite">
        <div className="dp-section-label" style={{ marginBottom: 10 }}>Score breakdown (weighted)</div>
        {TABS.filter(tab => tab.key !== 'purchasing').map(tab => {
          const WEIGHTS = { healthcare: 17, housing: 14, fiscal: 14, infrastructure: 10, economy: 14, education: 13, safety: 10, mentalhealth: 8 };
          return (
            <div key={tab.key} className="dp-composite__row">
              <span className="dp-composite__name">{tab.label} <span className="dp-composite__weight">{WEIGHTS[tab.key] != null ? `${WEIGHTS[tab.key]}%` : ''}</span></span>
              <div className="dp-composite__track">
                <div className="dp-composite__fill" style={{ width: `${tabScore(tab.key)}%`, background: gradeFill(tabGrade(tab.key)) }} />
              </div>
              <span className="dp-composite__score">{tabScore(tab.key)}</span>
            </div>
          );
        })}
        {province.valueScore != null && (
          <div className="dp-composite__value-row">
            <span>$ Value score <span className="dp-composite__weight">(score ÷ tax burden)</span></span>
            <span className="dp-composite__score dp-composite__score--value">{province.valueScore}</span>
          </div>
        )}
        <div style={{ marginTop: 12, textAlign: 'right' }}>
          <button className="methodology-link" onClick={onMethodology}>ℹ How we score this</button>
        </div>
      </div>
    </div>
  );
}
