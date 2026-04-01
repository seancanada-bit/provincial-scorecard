import { useEffect, useRef, useState } from 'react';
import { gradeFill, gradeColorClass, toGrade, PROVINCE_COLORS } from '../utils/grading.js';
import { track } from '../utils/track.js';

const CAT_KEYS  = ['performance', 'investment', 'electoral', 'demographics', 'expenses', 'transfers'];
const CAT_SHORT = {
  performance:  'MP Work',
  investment:   'Invest',
  electoral:    'Electoral',
  demographics: 'Demog.',
  expenses:     'Expenses',
  transfers:    'Transfers',
};
const CAT_ICONS = {
  performance:  '🏛️',
  investment:   '💰',
  electoral:    '🗳️',
  demographics: '📊',
  expenses:     '📋',
  transfers:    '🔄',
};

const PARTY_SHORT = {
  'Liberal':        'LPC',
  'Conservative':   'CPC',
  'NDP':            'NDP',
  'Bloc Québécois': 'BQ',
  'Green':          'GPC',
  'Green Party':    'GPC',
  'Independent':    'Ind',
};

export default function RidingCard({ riding, rank, globalRank, selected, onSelect, sortKey, partyColors }) {
  const color      = partyColors[riding.mpParty] ?? '#555';
  const cats       = riding.categories;
  const isDuckSort = sortKey === 'duck';
  const duckGrade  = riding.duckScore != null ? toGrade(riding.duckScore) : null;

  // Count-up animation
  const [displayScore, setDisplayScore] = useState(riding.composite);
  const animated = useRef(false);
  useEffect(() => {
    if (animated.current) return;
    animated.current = true;
    const target = riding.composite;
    const start  = Date.now();
    const dur    = 500;
    const frame = () => {
      const p = Math.min((Date.now() - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setDisplayScore(Math.round(e * target));
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [riding.composite]);

  const handleClick = () => {
    onSelect(selected ? null : riding);
    track('riding_select', { city: riding.ridingCode });
  };

  return (
    <article
      className={`ccard${selected ? ' ccard--selected' : ''}`}
      style={{ '--city-color': color }}
      aria-label={`${riding.name}: ${riding.grade}, ${riding.composite} out of 100`}
    >
      <div
        className="ccard__main"
        onClick={handleClick}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleClick()}
        tabIndex={0}
        role="button"
        aria-pressed={selected}
      >
        {/* Left: party badge + riding info */}
        <div className="ccard__left">
          <div className="ccard__badge" style={{ background: color }} aria-hidden="true">
            <span className="ccard__abbr">{PARTY_SHORT[riding.mpParty] ?? '?'}</span>
          </div>
          <div className="ccard__nameblock">
            <div className="ccard__name">{riding.name}</div>
            <div className="ccard__meta">
              <span className="ccard__province">{riding.mpName ?? 'Vacant'}</span>
              <span className="ccard__dot" aria-hidden="true"> · </span>
              <span className="ccard__mayor">{riding.province}</span>
            </div>
          </div>
        </div>

        {/* Right: rank + score */}
        <div className={`ccard__right${isDuckSort && duckGrade ? ' ccard__right--tower' : ''}`}>
          <span className="ccard__rank">#{rank}</span>

          {isDuckSort && duckGrade ? (
            <div className="ccard__value-tower">
              <span className="ccard__tower-duck" aria-hidden="true">🦆</span>
              <span className="ccard__tower-label" aria-hidden="true">BANG FOR YOUR DUCK</span>
              <span className={`ccard__grade ${gradeColorClass(duckGrade)}`}>{duckGrade}</span>
              <span className="ccard__score">
                {riding.duckScore}<span className="ccard__score-denom">/100</span>
              </span>
              <span className="ccard__tower-rule" aria-hidden="true" />
              <span className="ccard__tower-perf" aria-hidden="true">
                performance · <span style={{ color: gradeFill(riding.grade) }}>{riding.grade}</span> · {displayScore}
              </span>
            </div>
          ) : (
            <>
              <span className="ccard__perf-label">performance</span>
              <span className={`ccard__grade ${gradeColorClass(riding.grade)}`}>{riding.grade}</span>
              <span className="ccard__score">
                {displayScore}<span className="ccard__score-denom">/100</span>
              </span>
              {duckGrade && (
                <span className="ccard__duck-row">
                  <span className="ccard__value-divider" aria-hidden="true" />
                  <span className="ccard__duck-emoji" aria-hidden="true">🦆</span>
                  <span className="ccard__duck-words" aria-hidden="true">
                    <span>BANG</span><span>FOR</span><span>YOUR</span><span>DUCK</span>
                  </span>
                  <span className="ccard__duck-scores">
                    <span className="ccard__value-grade" style={{ color: gradeFill(duckGrade) }}>{duckGrade}</span>
                    <span className="ccard__value-subnum">{riding.duckScore}</span>
                  </span>
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Formula summary */}
      <div className="ccard__formula">
        <span className="ccard__formula-label">Grade = </span>
        <span className="ccard__formula-part" style={{ color: gradeFill(cats.investment?.grade) }}>
          Investment {cats.investment?.score ?? '—'}
        </span>
        <span className="ccard__formula-op"> × 50% + </span>
        <span className="ccard__formula-part" style={{ color: gradeFill(cats.transfers?.grade) }}>
          Transfers {cats.transfers?.score ?? '—'}
        </span>
        <span className="ccard__formula-op"> × 35% + </span>
        <span className="ccard__formula-part" style={{ color: gradeFill(cats.expenses?.grade) }}>
          Expenses {cats.expenses?.score ?? '—'}
        </span>
        <span className="ccard__formula-op"> × 15%</span>
      </div>

      {/* Category pills */}
      <div className="ccard__cats" role="list" aria-label="Category scores">
        {CAT_KEYS.map(key => {
          const cat      = cats[key];
          const score    = cat?.score ?? 0;
          const grade    = cat?.grade ?? toGrade(score);
          const isActive = sortKey === key;
          return (
            <div
              key={key}
              className={`ccard__pill${isActive ? ' ccard__pill--active' : ''}`}
              style={{ color: gradeFill(grade), background: isActive ? `${gradeFill(grade)}18` : undefined }}
              role="listitem"
              aria-label={`${CAT_SHORT[key]}: ${score}/100`}
            >
              <span className="ccard__pill-icon" aria-hidden="true">{CAT_ICONS[key]}</span>
              <span className="ccard__pill-label">{CAT_SHORT[key]}</span>
              <span className="ccard__pill-score">{score}</span>
            </div>
          );
        })}
      </div>
    </article>
  );
}
