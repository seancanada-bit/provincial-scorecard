import { gradeFillDark, toGrade } from '../utils/grading.js';

const DID_YOU_KNOW = [
  ({ csiGap }) => csiGap > 1 ? `Canada's safest city has a crime severity index ${csiGap}× lower than its least safe.` : null,
  ({ housingStartsGap }) => housingStartsGap > 1 ? `The top housing-start city builds ${housingStartsGap}× more homes per capita than the bottom.` : null,
  ({ surplusCityCount, total }) => surplusCityCount != null ? `${surplusCityCount} of ${total} cities are running operating surpluses.` : null,
];

export default function NationalSummary({ national, cities, provinceFilter, filteredCities }) {
  if (!national || !cities?.length) return null;

  const source   = provinceFilter !== 'ALL' ? filteredCities : cities;
  const byDuck   = [...source].sort((a, b) => (b.duckScore ?? 0) - (a.duckScore ?? 0));
  const bestDuck = byDuck[0];

  const bySafety  = [...source].sort((a, b) =>
    (a.categories?.safety?.crimeSeverityIndex ?? 999) - (b.categories?.safety?.crimeSeverityIndex ?? 999));
  const safest = bySafety[0];

  const byHousing = [...source].sort((a, b) =>
    (b.categories?.housing?.housingStartsPer1000 ?? 0) - (a.categories?.housing?.housingStartsPer1000 ?? 0));
  const mostBuilding = byHousing[0];

  const bestGrade = bestDuck?.duckScore != null ? toGrade(bestDuck.duckScore) : null;

  // Pick a rotating "did you know" fact
  const facts = DID_YOU_KNOW.map(fn => fn({
    csiGap:           national.csiGap,
    housingStartsGap: national.housingStartsGap,
    surplusCityCount: national.surplusCityCount,
    total:            national.totalCities,
  })).filter(Boolean);
  const fact = facts[0] ?? null;

  return (
    <div className="editorial-summary">
      <div className="editorial-summary__inner">
        <p className="editorial-summary__headline">
          {provinceFilter !== 'ALL'
            ? `Getting value for your property tax in ${provinceFilter}?`
            : 'Getting value for your property tax? The gap across Canada is wider than you think.'}
        </p>
        <div className="editorial-summary__callouts">
          <div className="editorial-callout">
            <span className="editorial-callout__label">Best bang for your duck</span>
            <span className="editorial-callout__province-row">
              <span className="editorial-callout__province">{bestDuck?.name}</span>
              <span className="editorial-callout__duck-accent" aria-hidden="true">🦆</span>
            </span>
            <span className="editorial-callout__grade" style={{ color: gradeFillDark(bestGrade) }}>
              {bestGrade} · {bestDuck?.duckScore}/100
            </span>
          </div>

          <div className="editorial-callout editorial-callout--divider" />

          <div className="editorial-callout">
            <span className="editorial-callout__label">Safest city</span>
            <span className="editorial-callout__province">{safest?.name}</span>
            <span className="editorial-callout__grade" style={{ color: gradeFillDark(safest?.categories?.safety?.grade) }}>
              {safest?.categories?.safety?.grade} · CSI {safest?.categories?.safety?.crimeSeverityIndex ?? '—'}
            </span>
          </div>

          <div className="editorial-callout editorial-callout--divider" />

          <div className="editorial-callout">
            <span className="editorial-callout__label">Most housing starts</span>
            <span className="editorial-callout__province">{mostBuilding?.name}</span>
            <span className="editorial-callout__grade" style={{ color: gradeFillDark(mostBuilding?.categories?.housing?.grade) }}>
              {mostBuilding?.categories?.housing?.grade} · {mostBuilding?.categories?.housing?.housingStartsPer1000 ?? '—'}/1k
            </span>
          </div>

          {fact && (
            <>
              <div className="editorial-callout editorial-callout--divider" />
              <div className="editorial-callout editorial-callout--fact">
                <span className="editorial-callout__label">Did you know?</span>
                <span className="editorial-callout__fact">{fact}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
