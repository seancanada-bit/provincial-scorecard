import { useEffect, useRef, useState, useCallback } from 'react';
import { PROVINCE_COLORS, PROVINCE_FLAGS, FLAG_POSITIONS, gradeFill, gradeColorClass, toGrade } from '../utils/grading.js';
import ProvinceDetailPanel from './ProvinceDetailPanel.jsx';
import Tooltip from './Tooltip.jsx';

// ─── Tooltip content helpers ────────────────────────────────────────────────

function TipRow({ label, value, score }) {
  return (
    <div className="tipcard__row">
      <span className="tipcard__row-label">{label}</span>
      <span className="tipcard__row-value">{value}</span>
      {score != null && (
        <span className="tipcard__bar-track">
          <span className="tipcard__bar-fill" style={{ width: `${Math.min(score, 100)}%` }} />
        </span>
      )}
    </div>
  );
}

function TipBody({ rows, source }) {
  const visible = rows.filter(r => r?.value != null);
  if (!visible.length) return null;
  return (
    <div>
      {visible.map((r, i) => <TipRow key={i} {...r} />)}
      <div className="tipcard__source">{source}</div>
    </div>
  );
}

// Returns null (not a React element) when no data rows have values —
// so Tooltip's `if (!content)` guard correctly skips rendering.
function tipOrNull(rows, source) {
  if (!rows.some(r => r.value != null)) return null;
  return <TipBody rows={rows} source={source} />;
}

function pillContent(key, cat) {
  if (!cat) return null;
  switch (key) {
    case 'healthcare':
      return tipOrNull([
        { label: 'Surgical wait',     value: cat.surgicalWaitWeeks    != null ? `${cat.surgicalWaitWeeks} wks`  : null, score: cat.surgicalWaitScore },
        { label: 'Primary care',      value: cat.primaryCareAttachPct != null ? `${cat.primaryCareAttachPct}%`  : null, score: cat.primaryCareScore },
        { label: 'ER benchmark met',  value: cat.erBenchmarkMetPct    != null ? `${cat.erBenchmarkMetPct}%`     : null, score: cat.erBenchmarkScore },
      ], 'CIHI');

    case 'housing':
      return tipOrNull([
        { label: 'Home price YoY',    value: cat.mlsHpiYoyPct              != null ? `${cat.mlsHpiYoyPct > 0 ? '+' : ''}${cat.mlsHpiYoyPct}%` : null, score: cat.priceScore },
        { label: 'Starts / 1k',       value: cat.housingStartsPer1000Growth != null ? `${cat.housingStartsPer1000Growth}`                       : null, score: cat.startsScore },
        { label: 'Rent inflation',    value: cat.rentInflationPct           != null ? `${cat.rentInflationPct}%`                                : null, score: cat.rentScore },
        { label: 'Core housing need', value: cat.coreHousingNeedPct        != null ? `${cat.coreHousingNeedPct}%`                              : null, score: cat.coreHousingNeedScore },
      ], 'CREA · CMHC · StatsCan');

    case 'fiscal':
      return tipOrNull([
        { label: 'Budget balance',    value: cat.budgetBalancePctGdp        != null ? `${cat.budgetBalancePctGdp}% GDP`                  : null, score: cat.balanceScore },
        { label: 'Net debt / capita', value: cat.netDebtPerCapita           != null ? `$${cat.netDebtPerCapita.toLocaleString('en-CA')}` : null, score: cat.debtScore },
        { label: 'Debt interest',     value: cat.debtInterestCentsPerDollar != null ? `${cat.debtInterestCentsPerDollar}¢ per $`         : null, score: cat.interestScore },
      ], 'StatsCan · DBRS');

    case 'infrastructure':
      return tipOrNull([
        { label: 'Avg cost overrun',  value: cat.avgOverrunPct    != null ? `${cat.avgOverrunPct}%`        : null, score: null },
        { label: 'Avg delay',         value: cat.avgDelayMonths   != null ? `${cat.avgDelayMonths} months` : null, score: null },
        { label: 'Projects tracked',  value: cat.projects?.length != null ? `${cat.projects.length}`      : null, score: null },
      ], 'Federal infrastructure database');

    case 'economy':
      return tipOrNull([
        { label: 'Unemployment',     value: cat.unemploymentRate    != null ? `${cat.unemploymentRate}%`                : null, score: cat.unemployScore },
        { label: 'GDP growth',       value: cat.gdpGrowthPct       != null ? `${cat.gdpGrowthPct}%`                    : null, score: cat.gdpGrowthScore },
        { label: 'Workplace injury', value: cat.workplaceInjuryRate != null ? `${cat.workplaceInjuryRate} / 100 workers`: null, score: cat.workplaceInjuryScore },
        { label: 'Avg childcare',    value: cat.childcareMonthlyAvg != null ? `$${cat.childcareMonthlyAvg}/mo`          : null, score: cat.childcareScore },
      ], 'StatsCan · AWCBC');

    case 'education':
      return tipOrNull([
        { label: 'PCAP avg',           value: cat.pcapMathScore        != null ? `${Math.round(((cat.pcapMathScore ?? 0) + (cat.pcapReadingScore ?? cat.pcapMathScore ?? 0)) / 2)}` : null, score: cat.pcapScore },
        { label: 'Univ. tuition',      value: cat.avgUniversityTuition != null ? `$${cat.avgUniversityTuition.toLocaleString('en-CA')}/yr`                                          : null, score: cat.tuitionScore },
        { label: 'Student:teacher',    value: cat.studentTeacherRatio  != null ? `${cat.studentTeacherRatio}:1`                                                                      : null, score: null },
      ], 'CMEC · StatsCan');

    case 'safety':
      return tipOrNull([
        { label: 'Victimization rate', value: cat.victimizationRatePer1000 != null ? `${cat.victimizationRatePer1000} per 1,000` : null, score: cat.victimizationScore },
        { label: 'Homicide rate',      value: cat.homicideRatePer100k      != null ? `${cat.homicideRatePer100k} per 100k`       : null, score: cat.homicideScore },
      ], 'StatsCan GSS');

    case 'mentalhealth':
      return tipOrNull([
        { label: 'Drug toxicity',    value: cat.drugToxicityRatePer100k != null ? `${cat.drugToxicityRatePer100k} per 100k`   : null, score: cat.drugToxicityScore },
        { label: 'Psychiatric beds', value: cat.psychiatricBedsPer100k  != null ? `${cat.psychiatricBedsPer100k} per 100k`    : null, score: cat.psychiatricBedsScore },
        { label: 'MH budget',        value: cat.mentalHealthBudgetPct   != null ? `${cat.mentalHealthBudgetPct}% of health $` : null, score: cat.mhBudgetScore },
      ], 'CIHI · Health Canada');

    case 'ltc':
      return tipOrNull([
        { label: 'LTC beds',          value: cat.ltcBedsPer1k75plus      != null ? `${cat.ltcBedsPer1k75plus} per 1k (75+)` : null, score: cat.ltcBedsScore },
        { label: 'Direct care hours', value: cat.directCareHoursPerDay   != null ? `${cat.directCareHoursPerDay} hrs/day`   : null, score: cat.directCareScore },
        { label: 'Home care',         value: cat.homeCareRecipientsPer1k != null ? `${cat.homeCareRecipientsPer1k} per 1k`  : null, score: cat.homeCareScore },
      ], 'CIHI LTC Homes 2023');

    default: return null;
  }
}

const CAT_KEYS = ['healthcare', 'housing', 'fiscal', 'infrastructure', 'economy', 'education', 'safety', 'mentalhealth', 'ltc'];
const CAT_SHORT = { healthcare: 'Health', housing: 'Housing', fiscal: 'Fiscal', infrastructure: 'Infra', economy: 'Economy', education: 'Edu', safety: 'Safety', mentalhealth: 'Mental', ltc: 'LTC' };

export default function ProvinceCard({
  province, rank, selected, expanded, onSelect, sortKey, animateCount, onMethodology, isMobile,
}) {
  const color = PROVINCE_COLORS[province.code] ?? '#333';
  const cats = province.categories;

  // Count-up animation for composite score
  const [displayScore, setDisplayScore] = useState(animateCount ? 0 : province.composite);
  const animated = useRef(false);
  useEffect(() => {
    if (!animateCount || animated.current) return;
    animated.current = true;
    const target = province.composite;
    const start = Date.now();
    const duration = 600;
    const frame = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayScore(Math.round(eased * target));
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [animateCount, province.composite]);

  const isValueSort = sortKey === 'value';

  const [showValueTip, setShowValueTip] = useState(false);
  const valueBadgeRef = useRef(null);

  // Close tooltip on outside click
  useEffect(() => {
    if (!showValueTip) return;
    const handler = e => {
      if (!valueBadgeRef.current?.contains(e.target)) setShowValueTip(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showValueTip]);

  const handleClick = () => onSelect(province.code);

  return (
    <article
      className={`pcard${selected ? ' pcard--selected' : ''}`}
      style={{ '--prov-color': color }}
      aria-label={`${province.name}: ${province.grade}, ${province.composite} out of 100`}
    >
      <div
        className="pcard__main"
        onClick={handleClick}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleClick()}
        tabIndex={0}
        role="button"
        aria-expanded={isMobile ? expanded : undefined}
        aria-pressed={!isMobile ? selected : undefined}
      >
        {/* Left: flag badge + name */}
        <div className="pcard__left">
          <div className="pcard__badge" style={{ borderColor: color }} aria-hidden="true">
            <img
              src={PROVINCE_FLAGS[province.code]}
              alt={`Flag of ${province.name}`}
              className="pcard__flag"
              style={{ objectPosition: FLAG_POSITIONS[province.code] ?? 'center' }}
              onError={e => {
                e.target.style.display = 'none';
                e.target.parentNode.style.background = color;
                e.target.parentNode.style.color = '#fff';
                e.target.parentNode.textContent = province.code;
              }}
            />
          </div>
          <div className="pcard__nameblock">
            <div className="pcard__name">{province.name}</div>
            <div className="pcard__premier"><span className="pcard__premier-title">Premier</span> {province.premierName}</div>
          </div>
        </div>

        {/* Right: rank + two named score blocks — swaps based on sort */}
        {(() => {
          const duckGrade = province.valueScore != null ? toGrade(province.valueScore) : null;
          const duckDesc  = duckGrade ? ({ A: 'Excellent', B: 'Good', C: 'Fair', D: 'Below average', F: 'Poor' }[duckGrade[0]] ?? '') : '';

          return (
            <div className="pcard__right">
              <span className="pcard__rank">#{rank}</span>

              {isValueSort && duckGrade ? (
                /* ── VALUE MODE: duck is primary, performance is secondary ── */
                <>
                  <span className="pcard__perf-label">🦆 bang for your duck</span>
                  <span
                    className={`pcard__grade ${gradeColorClass(duckGrade)}`}
                    aria-label={`Duck grade ${duckGrade}`}
                  >
                    {duckGrade}
                  </span>
                  <span className="pcard__score" aria-label={`${province.valueScore} out of 100`}>
                    {province.valueScore}<span className="pcard__score-denom">/100</span>
                  </span>

                  {/* Performance as secondary */}
                  <span className="pcard__value-badge" aria-label={`Performance: ${province.grade}, ${displayScore} out of 100`}>
                    <span className="pcard__value-divider" aria-hidden="true" />
                    <span className="pcard__duck-row">
                      <span className="pcard__duck-words" aria-hidden="true">
                        <span>PERF</span><span>SCORE</span>
                      </span>
                      <span className="pcard__duck-scores">
                        <span className="pcard__value-grade" style={{ color: gradeFill(province.grade) }}>{province.grade}</span>
                        <span className="pcard__value-subnum">{displayScore}</span>
                      </span>
                    </span>
                  </span>
                </>
              ) : (
                /* ── PERFORMANCE MODE: perf is primary, duck is secondary ── */
                <>
                  <span className="pcard__perf-label">performance</span>
                  <span
                    className={`pcard__grade ${gradeColorClass(province.grade)}`}
                    aria-label={`Grade ${province.grade}`}
                  >
                    {province.grade}
                  </span>
                  <span className="pcard__score" aria-label={`${displayScore} out of 100`}>
                    {displayScore}<span className="pcard__score-denom">/100</span>
                  </span>

                  {duckGrade && (
                    <span
                      ref={valueBadgeRef}
                      className={`pcard__value-badge${showValueTip ? ' pcard__value-badge--open' : ''}`}
                      onClick={e => { e.stopPropagation(); setShowValueTip(v => !v); }}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); setShowValueTip(v => !v); } }}
                      role="button"
                      tabIndex={0}
                      aria-expanded={showValueTip}
                      aria-label={`Duck Score: ${duckGrade} — ${duckDesc} value. Click for explanation.`}
                    >
                      <span className="pcard__value-divider" aria-hidden="true" />
                      <span className="pcard__duck-row">
                        <span className="pcard__duck-emoji" aria-hidden="true">🦆</span>
                        <span className="pcard__duck-words" aria-hidden="true">
                          <span>BANG</span><span>FOR</span><span>YOUR</span><span>DUCK</span>
                        </span>
                        <span className="pcard__duck-scores">
                          <span className="pcard__value-grade" style={{ color: gradeFill(duckGrade) }}>{duckGrade}</span>
                          <span className="pcard__value-subnum">{province.valueScore}</span>
                        </span>
                      </span>
                      {showValueTip && (
                        <span className="pcard__value-tip" role="tooltip">
                          <strong>🦆 Duck Score: {duckGrade}</strong> — {duckDesc.toLowerCase()} value for provincial taxes paid.
                          This province delivers {duckGrade[0] === 'A' || duckGrade[0] === 'B' ? 'above' : duckGrade[0] === 'C' ? 'around' : 'below'}-average
                          government services relative to its tax burden.
                        </span>
                      )}
                    </span>
                  )}
                </>
              )}
            </div>
          );
        })()}
      </div>

      {/* Category score pills */}
      <div className="pcard__cats" role="list" aria-label="Category scores">
        {CAT_KEYS.map(key => {
          const score = cats[key]?.score ?? 0;
          const grade = toGrade(score);
          const isActive = sortKey === key;
          return (
            <Tooltip key={key} content={pillContent(key, cats[key])}>
              <div
                className={`pcard__pill${isActive ? ' pcard__pill--active' : ''}`}
                style={{ color: gradeFill(grade), background: isActive ? `${gradeFill(grade)}18` : undefined }}
                role="listitem"
                aria-label={`${CAT_SHORT[key]}: ${score}/100`}
              >
                <span className="pcard__pill-label">{CAT_SHORT[key]}</span>
                <span className="pcard__pill-score">{score}</span>
              </div>
            </Tooltip>
          );
        })}
      </div>

      {/* Mobile inline expansion */}
      {isMobile && expanded && (
        <ProvinceDetailPanel
          province={province}
          onMethodology={onMethodology}
        />
      )}
    </article>
  );
}
