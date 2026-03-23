import { useEffect, useRef, useState, useCallback } from 'react';
import { PROVINCE_COLORS, PROVINCE_FLAGS, FLAG_POSITIONS, gradeFill, gradeColorClass, toGrade } from '../utils/grading.js';
import ProvinceDetailPanel from './ProvinceDetailPanel.jsx';

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
        {/* Rank */}
        <span className="pcard__rank">#{rank}</span>

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
                <span className="pcard__value-label">🦆 Duck Score</span>
                <span className="pcard__value-grade" style={{ color: gradeFill(duckGrade) }}>{duckGrade}</span>
                <span className="pcard__value-subnum">{province.valueScore}</span>
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
