import { useEffect, useRef, useState } from 'react';
import {
  PROVINCE_COLORS, CATEGORY_ICONS, gradeColorClass,
  gradeBgClass, gradeFill, scoreFill, toGrade,
} from '../utils/grading.js';
import ProvinceDetail from './ProvinceDetail.jsx';

export default function ProvinceCard({
  province, rank, expanded, onToggle, sortKey, animateCount, onMethodology,
}) {
  const cats = province.categories;
  const color = PROVINCE_COLORS[province.code] ?? '#333';

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
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [animateCount, province.composite]);

  const categoryScore = key => {
    if (key === 'overall') return province.composite;
    return cats[key]?.score ?? 0;
  };

  const catList = [
    { key: 'healthcare',     label: 'Health' },
    { key: 'housing',        label: 'Housing' },
    { key: 'fiscal',         label: 'Fiscal' },
    { key: 'infrastructure', label: 'Infra' },
    { key: 'economy',        label: 'Economy' },
  ];

  const freshnessParts = Object.entries(province.lastUpdated || {})
    .filter(([, v]) => v)
    .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)} ${new Date(v).toLocaleDateString('en-CA', { month: 'short', year: 'numeric' })}`);

  return (
    <article
      className={`province-card${expanded ? ' province-card--expanded' : ''}`}
      aria-label={`${province.name}: ${province.grade}, ${province.composite} out of 100`}
    >
      <div className="province-card__header-wrap">
        <span className="province-card__rank" aria-label={`Rank ${rank}`}>#{rank}</span>

        <div
          className="province-card__header"
          onClick={onToggle}
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onToggle()}
          tabIndex={0}
          role="button"
          aria-expanded={expanded}
          aria-controls={`detail-${province.code}`}
        >
          {/* Province badge */}
          <div
            className="province-card__badge"
            style={{ background: color }}
            aria-hidden="true"
          >
            {province.code}
          </div>

          {/* Name + premier */}
          <div className="province-card__name-wrap">
            <div className="province-card__name">{province.name}</div>
            <div className="province-card__premier">{province.premierName}</div>
          </div>

          {/* Grade + score */}
          <div className="province-card__grade-wrap">
            <span
              className={`province-card__grade ${gradeColorClass(province.grade)}`}
              aria-label={`Grade: ${province.grade}`}
            >
              {province.grade}
            </span>
            <div>
              <div className="province-card__score" aria-label={`${displayScore} out of 100`}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', color: 'var(--text-primary)' }}>
                  {displayScore}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>/100</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category mini-chips */}
      <div className="province-card__cats" role="list" aria-label="Category scores">
        {catList.map(({ key, label }) => {
          const score = categoryScore(key);
          const grade = toGrade(score);
          const isActive = sortKey === key;
          return (
            <div
              key={key}
              className={`cat-chip ${gradeBgClass(grade)}`}
              style={{
                border: isActive ? `1px solid ${gradeFill(grade)}` : undefined,
                opacity: sortKey !== 'overall' && !isActive ? 0.65 : 1,
              }}
              role="listitem"
              aria-label={`${label}: ${score}/100, Grade ${grade}`}
            >
              <span className="cat-chip__icon" aria-hidden="true">{CATEGORY_ICONS[key]}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{label}</span>
              <span className={`cat-chip__score ${gradeColorClass(grade)}`}>{score}</span>
            </div>
          );
        })}
      </div>

      {/* Freshness */}
      {freshnessParts.length > 0 && (
        <div className="province-card__freshness" aria-label="Data freshness">
          Last updated: {freshnessParts.join(' · ')}
        </div>
      )}

      {/* Expand/collapse hint */}
      <button
        className="province-card__expand-hint"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={`detail-${province.code}`}
      >
        <span>{expanded ? 'Hide breakdown' : 'See full breakdown'}</span>
        <span className={`province-card__chevron${expanded ? ' province-card__chevron--open' : ''}`} aria-hidden="true">
          ▾
        </span>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div id={`detail-${province.code}`} role="region" aria-label={`${province.name} detailed breakdown`}>
          <ProvinceDetail province={province} onMethodology={onMethodology} />
        </div>
      )}
    </article>
  );
}
