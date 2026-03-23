import { useEffect, useRef, useState } from 'react';
import { PROVINCE_COLORS, gradeFill, gradeColorClass, toGrade } from '../utils/grading.js';
import ProvinceDetailPanel from './ProvinceDetailPanel.jsx';

const CAT_KEYS = ['healthcare', 'housing', 'fiscal', 'infrastructure', 'economy', 'education'];
const CAT_SHORT = { healthcare: 'Health', housing: 'Housing', fiscal: 'Fiscal', infrastructure: 'Infra', economy: 'Economy', education: 'Edu' };

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
        {/* Rank */}
        <span className="pcard__rank">#{rank}</span>

        {/* Left: badge + name */}
        <div className="pcard__left">
          <div className="pcard__badge" style={{ background: color }} aria-hidden="true">{province.code}</div>
          <div className="pcard__nameblock">
            <div className="pcard__name">{province.name}</div>
            <div className="pcard__premier">{province.premierName}</div>
          </div>
        </div>

        {/* Right: grade hero + value badge */}
        <div className="pcard__right">
          <span
            className={`pcard__grade ${gradeColorClass(province.grade)}`}
            aria-label={`Grade ${province.grade}`}
          >
            {province.grade}
          </span>
          <span className="pcard__score" aria-label={`${displayScore} out of 100`}>
            {displayScore}<span className="pcard__score-denom">/100</span>
          </span>
          {province.valueScore != null && (
            <span
              className="pcard__value-badge"
              title="Value score: overall grade ÷ tax burden. How much do you get for what you pay?"
              aria-label={`Value score ${province.valueScore}`}
            >
              ${province.valueScore}
            </span>
          )}
        </div>
      </div>

      {/* Category score pills */}
      <div className="pcard__cats" role="list" aria-label="Category scores">
        {CAT_KEYS.map(key => {
          const score = cats[key]?.score ?? 0;
          const grade = toGrade(score);
          const isActive = sortKey === key;
          return (
            <div
              key={key}
              className={`pcard__pill${isActive ? ' pcard__pill--active' : ''}`}
              style={{ color: gradeFill(grade), background: isActive ? `${gradeFill(grade)}18` : undefined }}
              role="listitem"
              aria-label={`${CAT_SHORT[key]}: ${score}/100`}
            >
              <span className="pcard__pill-label">{CAT_SHORT[key]}</span>
              <span className="pcard__pill-score">{score}</span>
            </div>
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
