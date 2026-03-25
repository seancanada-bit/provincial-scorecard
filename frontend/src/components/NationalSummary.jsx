import { gradeFillDark, toGrade } from '../utils/grading.js';

export default function NationalSummary({ national, provinces }) {
  if (!national || !provinces) return null;

  // Value rankings — sort by duck score
  const byValue    = [...provinces].sort((a, b) => (b.valueScore ?? 0) - (a.valueScore ?? 0));
  const bestValue  = byValue[0];
  const worstValue = byValue[byValue.length - 1];

  // Biggest overcharge — province paying the most per point of service quality
  // taxBurdenIndex > 100 means above-average taxes; divide by composite for cost-per-point
  const mostOvercharged = [...provinces]
    .filter(p => p.taxes?.taxBurdenIndex != null && p.composite > 0)
    .sort((a, b) =>
      (b.taxes.taxBurdenIndex / b.composite) - (a.taxes.taxBurdenIndex / a.composite)
    )[0];

  const bestValueGrade  = bestValue?.valueScore  != null ? toGrade(bestValue.valueScore)  : null;
  const worstValueGrade = worstValue?.valueScore != null ? toGrade(worstValue.valueScore) : null;

  return (
    <div className="editorial-summary">
      <div className="editorial-summary__inner">
        <p className="editorial-summary__headline">
          Getting bang for your duck?<br/>The gap across Canada is wider than you think.
        </p>
        <div className="editorial-summary__callouts">
          <div className="editorial-callout">
            <span className="editorial-callout__label">Best bang for your duck</span>
            <span className="editorial-callout__province-row">
              <span className="editorial-callout__province">{bestValue?.name}</span>
              <span className="editorial-callout__duck-accent" aria-hidden="true">🦆</span>
            </span>
            <span className="editorial-callout__grade" style={{ color: gradeFillDark(bestValueGrade) }}>
              {bestValueGrade} · {bestValue?.valueScore}/100
            </span>
          </div>
          <div className="editorial-callout editorial-callout--divider" />
          <div className="editorial-callout">
            <span className="editorial-callout__label">Worst bang for your duck</span>
            <span className="editorial-callout__province">{worstValue?.name}</span>
            <span className="editorial-callout__grade" style={{ color: gradeFillDark(worstValueGrade) }}>
              {worstValueGrade} · {worstValue?.valueScore}/100
            </span>
          </div>
          <div className="editorial-callout editorial-callout--divider" />
          <div className="editorial-callout">
            <span className="editorial-callout__label">Biggest overcharge</span>
            <span className="editorial-callout__province">{mostOvercharged?.name}</span>
            <span className="editorial-callout__grade" style={{ color: gradeFillDark(mostOvercharged?.grade) }}>
              {mostOvercharged?.grade} · {mostOvercharged?.composite}/100 performance
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
