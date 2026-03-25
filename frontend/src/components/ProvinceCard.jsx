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

function pillContent(key, cat) {
  if (!cat) return null;
  switch (key) {
    case 'healthcare':
      return <TipBody rows={[
        { label: 'Surgical wait',     value: cat.surgicalWaitWeeks    != null ? `${cat.surgicalWaitWeeks} wks`  : null, score: cat.surgicalWaitScore },
        { label: 'Primary care',      value: cat.primaryCareAttachPct != null ? `${cat.primaryCareAttachPct}%`  : null, score: cat.primaryCareScore },
        { label: 'ER benchmark met',  value: cat.erBenchmarkMetPct    != null ? `${cat.erBenchmarkMetPct}%`     : null, score: cat.erBenchmarkScore },
      ]} source="CIHI" />;

    case 'housing':
      return <TipBody rows={[
        { label: 'Home price YoY',    value: cat.mlsHpiYoyPct              != null ? `${cat.mlsHpiYoyPct > 0 ? '+' : ''}${cat.mlsHpiYoyPct}%` : null, score: cat.priceScore },
        { label: 'Starts / 1k',       value: cat.housingStartsPer1000Growth != null ? `${cat.housingStartsPer1000Growth}`                       : null, score: cat.startsScore },
        { label: 'Rent inflation',    value: cat.rentInflationPct           != null ? `${cat.rentInflationPct}%`                                : null, score: cat.rentScore },
        { label: 'Core housing need', value: cat.coreHousingNeedPct        != null ? `${cat.coreHousingNeedPct}%`                              : null, score: cat.coreHousingNeedScore },
      ]} source="CREA · CMHC · StatsCan" />;

    case 'fiscal':
      return <TipBody rows={[
        { label: 'Budget balance',    value: cat.budgetBalancePctGdp       != null ? `${cat.budgetBalancePctGdp}% GDP`                       : null, score: cat.balanceScore },
        { label: 'Net debt / capita', value: cat.netDebtPerCapita          != null ? `$${cat.netDebtPerCapita.toLocaleString('en-CA')}`       : null, score: cat.debtScore },
        { label: 'Debt interest',     value: cat.debtInterestCentsPerDollar != null ? `${cat.debtInterestCentsPerDollar}¢ per $`              : null, score: cat.interestScore },
      ]} source="StatsCan · DBRS" />;

    case 'infrastructure':
      return <TipBody rows={[
        { label: 'Avg cost overrun',  value: cat.avgOverrunPct   != null ? `${cat.avgOverrunPct}%`       : null, score: null },
        { label: 'Avg delay',         value: cat.avgDelayMonths  != null ? `${cat.avgDelayMonths} months`: null, score: null },
        { label: 'Projects tracked',  value: cat.projects?.length != null ? `${cat.projects.length}`     : null, score: null },
      ]} source="Federal infrastructure database" />;

    case 'economy':
      return <TipBody rows={[
        { label: 'Unemployment',      value: cat.unemploymentRate     != null ? `${cat.unemploymentRate}%`               : null, score: cat.unemployScore },
        { label: 'GDP growth',        value: cat.gdpGrowthPct        != null ? `${cat.gdpGrowthPct}%`                   : null, score: cat.gdpGrowthScore },
        { label: 'Workplace injury',  value: cat.workplaceInjuryRate  != null ? `${cat.workplaceInjuryRate} / 100 workers`: null, score: cat.workplaceInjuryScore },
        { label: 'Avg childcare',     value: cat.childcareMonthlyAvg  != null ? `$${cat.childcareMonthlyAvg}/mo`         : null, score: cat.childcareScore },
      ]} source="StatsCan · AWCBC" />;

    case 'education':
      return <TipBody rows={[
        { label: 'PCAP avg',          value: cat.pcapMathScore != null ? `${Math.round(((cat.pcapMathScore ?? 0) + (cat.pcapReadingScore ?? cat.pcapMathScore ?? 0)) / 2)}` : null, score: cat.pcapScore },
        { label: 'University tuition',value: cat.avgUniversityTuition  != null ? `$${cat.avgUniversityTuition.toLocaleString('en-CA')}/yr` : null, score: cat.tuitionScore },
        { label: 'Student:teacher',   value: cat.studentTeacherRatio   != null ? `${cat.studentTeacherRatio}:1`                           : null, score: null },
      ]} source="CMEC · StatsCan" />;

    case 'safety':
      return <TipBody rows={[
        { label: 'Victimization rate',value: cat.victimizationRatePer1000 != null ? `${cat.victimizationRatePer1000} per 1,000` : null, score: cat.victimizationScore },
        { label: 'Homicide rate',     value: cat.homicideRatePer100k      != null ? `${cat.homicideRatePer100k} per 100k`       : null, score: cat.homicideScore },
      ]} source="StatsCan GSS" />;

    case 'mentalhealth':
      return <TipBody rows={[
        { label: 'Drug toxicity deaths', value: cat.drugToxicityRatePer100k  != null ? `${cat.drugToxicityRatePer100k} per 100k`    : null, score: cat.drugToxicityScore },
        { label: 'Psychiatric beds',     value: cat.psychiatricBedsPer100k   != null ? `${cat.psychiatricBedsPer100k} per 100k`     : null, score: cat.psychiatricBedsScore },
        { label: 'MH budget',            value: cat.mentalHealthBudgetPct    != null ? `${cat.mentalHealthBudgetPct}% of health $`  : null, score: cat.mhBudgetScore },
      ]} source="CIHI · Health Canada" />;

    case 'ltc':
      return <TipBody rows={[
        { label: 'LTC beds',          value: cat.ltcBedsPer1k75plus      != null ? `${cat.ltcBedsPer1k75plus} per 1k (75+)`  : null, score: cat.ltcBedsScore },
        { label: 'Direct care hours', value: cat.directCareHoursPerDay   != null ? `${cat.directCareHoursPerDay} hrs/day`    : null, score: cat.directCareScore },
        { label: 'Home care',         value: cat.homeCareRecipientsPer1k != null ? `${cat.homeCareRecipientsPer1k} per 1k`   : null, score: cat.homeCareScore },
      ]} source="CIHI LTC Homes 2023" />;

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

        {/* Right: rank + two named score blocks — performance + bang/duck */}
        <div className="pcard__right">
          <span className="pcard__rank">#{rank}</span>
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
          {province.valueScore != null && (() => {
            const duckGrade = toGrade(province.valueScore);
            const duckDesc  = { A: 'Excellent', B: 'Good', C: 'Fair', D: 'Below average', F: 'Poor' }[duckGrade[0]] ?? '';
            return (
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
            );
          })()}
        </div>
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
