import { useEffect, useRef, useState } from 'react';
import { gradeFill, gradeColorClass, toGrade, PROVINCE_COLORS, PROVINCE_NAMES, CATEGORY_ICONS } from '../utils/grading.js';
import Tooltip from './Tooltip.jsx';
import { track } from '../utils/track.js';

const CAT_KEYS  = ['housing', 'safety', 'fiscal', 'liveability', 'economic', 'community'];
const CAT_SHORT = {
  housing:     'Housing',
  safety:      'Safety',
  fiscal:      'Fiscal',
  liveability: 'Liveable',
  economic:    'Economic',
  community:   'Community',
};

function pillTooltip(key, cat) {
  if (!cat) return null;
  switch (key) {
    case 'housing':
      return cat.housingStartsPer1000 != null ? (
        <div>
          <div className="tipcard__row">
            <span className="tipcard__row-label">Starts/1k pop</span>
            <span className="tipcard__row-value">{cat.housingStartsPer1000}</span>
          </div>
          {cat.rentToIncomeRatio != null && (
            <div className="tipcard__row">
              <span className="tipcard__row-label">Rent-to-income</span>
              <span className="tipcard__row-value">{cat.rentToIncomeRatio}%</span>
            </div>
          )}
          {cat.mlsHpiYoyPct != null && (
            <div className="tipcard__row">
              <span className="tipcard__row-label">HPI YoY</span>
              <span className="tipcard__row-value">{cat.mlsHpiYoyPct > 0 ? '+' : ''}{cat.mlsHpiYoyPct}%</span>
            </div>
          )}
          <div className="tipcard__source">CMHC · CREA</div>
        </div>
      ) : null;

    case 'safety':
      return cat.crimeSeverityIndex != null ? (
        <div>
          <div className="tipcard__row">
            <span className="tipcard__row-label">Crime Severity</span>
            <span className="tipcard__row-value">{cat.crimeSeverityIndex}</span>
            <span className="tipcard__bar-track">
              <span className="tipcard__bar-fill" style={{ width: `${Math.min(cat.csiScore ?? 0, 100)}%` }} />
            </span>
          </div>
          {cat.violentCsi != null && (
            <div className="tipcard__row">
              <span className="tipcard__row-label">Violent CSI</span>
              <span className="tipcard__row-value">{cat.violentCsi}</span>
            </div>
          )}
          {cat.csi10yrTrend && (
            <div className="tipcard__row">
              <span className="tipcard__row-label">10-yr trend</span>
              <span className="tipcard__row-value">{cat.csi10yrTrend}</span>
            </div>
          )}
          <div className="tipcard__source">Stats Canada</div>
        </div>
      ) : null;

    case 'fiscal':
      return cat.propertyTaxRate != null ? (
        <div>
          <div className="tipcard__row">
            <span className="tipcard__row-label">Property tax</span>
            <span className="tipcard__row-value">{cat.propertyTaxRate}%</span>
          </div>
          {cat.infraSpendingPct != null && (
            <div className="tipcard__row">
              <span className="tipcard__row-label">Infra spending</span>
              <span className="tipcard__row-value">{cat.infraSpendingPct}% of budget</span>
            </div>
          )}
          {cat.netDebtPerCapita != null && (
            <div className="tipcard__row">
              <span className="tipcard__row-label">Net debt/capita</span>
              <span className="tipcard__row-value">${cat.netDebtPerCapita.toLocaleString('en-CA')}</span>
            </div>
          )}
          <div className="tipcard__source">Municipal budget reports</div>
        </div>
      ) : null;

    case 'economic':
      return cat.unemploymentRate != null ? (
        <div>
          <div className="tipcard__row">
            <span className="tipcard__row-label">Unemployment</span>
            <span className="tipcard__row-value">{cat.unemploymentRate}%</span>
          </div>
          {cat.populationGrowthPct != null && (
            <div className="tipcard__row">
              <span className="tipcard__row-label">Pop. growth</span>
              <span className="tipcard__row-value">{cat.populationGrowthPct > 0 ? '+' : ''}{cat.populationGrowthPct}%/yr</span>
            </div>
          )}
          {cat.medianHouseholdIncome != null && (
            <div className="tipcard__row">
              <span className="tipcard__row-label">Median income</span>
              <span className="tipcard__row-value">${cat.medianHouseholdIncome.toLocaleString('en-CA')}</span>
            </div>
          )}
          <div className="tipcard__source">Stats Canada</div>
        </div>
      ) : null;

    default: return null;
  }
}

export default function CityCard({ city, rank, globalRank, selected, onSelect, sortKey }) {
  const color      = PROVINCE_COLORS[city.provinceAbbr] ?? '#555';
  const cats       = city.categories;
  const isDuckSort = sortKey === 'duck';

  const duckGrade = city.duckScore != null ? toGrade(city.duckScore) : null;

  // Count-up animation
  const [displayScore, setDisplayScore] = useState(city.composite);
  const animated = useRef(false);
  useEffect(() => {
    if (animated.current) return;
    animated.current = true;
    const target = city.composite;
    const start  = Date.now();
    const dur    = 500;
    const frame = () => {
      const p = Math.min((Date.now() - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setDisplayScore(Math.round(e * target));
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [city.composite]);

  const handleClick = () => {
    onSelect(selected ? null : city);
    track('city_select', { city: city.cmaCode });
  };

  return (
    <article
      className={`ccard${selected ? ' ccard--selected' : ''}`}
      style={{ '--city-color': color }}
      aria-label={`${city.name}: ${city.grade}, ${city.composite} out of 100`}
    >
      <div
        className="ccard__main"
        onClick={handleClick}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleClick()}
        tabIndex={0}
        role="button"
        aria-pressed={selected}
      >
        {/* Left: province swatch + city info */}
        <div className="ccard__left">
          <div className="ccard__badge" style={{ background: color }} aria-hidden="true">
            <span className="ccard__abbr">{city.provinceAbbr}</span>
          </div>
          <div className="ccard__nameblock">
            <div className="ccard__name">{city.name}</div>
            <div className="ccard__meta">
              <span className="ccard__province">{PROVINCE_NAMES[city.provinceAbbr] ?? city.provinceAbbr}</span>
              {city.mayorName && (
                <><span className="ccard__dot" aria-hidden="true"> · </span>
                <span className="ccard__mayor">Mayor {city.mayorName}</span></>
              )}
            </div>
          </div>
        </div>

        {/* Right: rank + score block */}
        <div className={`ccard__right${isDuckSort && duckGrade ? ' ccard__right--tower' : ''}`}>
          <span className="ccard__rank">#{rank}</span>

          {isDuckSort && duckGrade ? (
            /* Value mode: typographic tower */
            <div
              className="ccard__value-tower"
              aria-label={`Duck grade ${duckGrade}, ${city.duckScore} out of 100. Performance: ${city.grade}, ${displayScore} out of 100`}
            >
              <span className="ccard__tower-duck" aria-hidden="true">🦆</span>
              <span className="ccard__tower-label" aria-hidden="true">BANG FOR YOUR DUCK</span>
              <span className={`ccard__grade ${gradeColorClass(duckGrade)}`} aria-hidden="true">{duckGrade}</span>
              <span className="ccard__score" aria-hidden="true">
                {city.duckScore}<span className="ccard__score-denom">/100</span>
              </span>
              <span className="ccard__tower-rule" aria-hidden="true" />
              <span className="ccard__tower-perf" aria-hidden="true">
                performance · <span style={{ color: gradeFill(city.grade) }}>{city.grade}</span> · {displayScore}
              </span>
            </div>
          ) : (
            /* Performance mode */
            <>
              <span className="ccard__perf-label">performance</span>
              <span className={`ccard__grade ${gradeColorClass(city.grade)}`} aria-label={`Grade ${city.grade}`}>
                {city.grade}
              </span>
              <span className="ccard__score" aria-label={`${displayScore} out of 100`}>
                {displayScore}<span className="ccard__score-denom">/100</span>
              </span>
              {duckGrade && (
                <span className="ccard__duck-row" aria-label={`Duck score: ${duckGrade}, ${city.duckScore}/100`}>
                  <span className="ccard__value-divider" aria-hidden="true" />
                  <span className="ccard__duck-emoji" aria-hidden="true">🦆</span>
                  <span className="ccard__duck-words" aria-hidden="true">
                    <span>BANG</span><span>FOR</span><span>YOUR</span><span>DUCK</span>
                  </span>
                  <span className="ccard__duck-scores">
                    <span className="ccard__value-grade" style={{ color: gradeFill(duckGrade) }}>{duckGrade}</span>
                    <span className="ccard__value-subnum">{city.duckScore}</span>
                  </span>
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Category pills */}
      <div className="ccard__cats" role="list" aria-label="Category scores">
        {CAT_KEYS.map(key => {
          const cat      = cats[key];
          const score    = cat?.score ?? 0;
          const grade    = cat?.grade ?? toGrade(score);
          const isActive = sortKey === key;
          return (
            <Tooltip key={key} content={pillTooltip(key, cat)}>
              <div
                className={`ccard__pill${isActive ? ' ccard__pill--active' : ''}`}
                style={{ color: gradeFill(grade), background: isActive ? `${gradeFill(grade)}18` : undefined }}
                role="listitem"
                aria-label={`${CAT_SHORT[key]}: ${score}/100`}
              >
                <span className="ccard__pill-icon" aria-hidden="true">{CATEGORY_ICONS[key]}</span>
                <span className="ccard__pill-label">{CAT_SHORT[key]}</span>
                <span className="ccard__pill-score">{score}</span>
              </div>
            </Tooltip>
          );
        })}
      </div>
    </article>
  );
}
