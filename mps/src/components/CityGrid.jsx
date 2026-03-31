import CityCard from './CityCard.jsx';

function LoadingSkeleton() {
  return (
    <div className="city-grid" aria-busy="true" aria-label="Loading cities…">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="ccard ccard--skeleton" aria-hidden="true">
          <div className="ccard__main">
            <div className="ccard__left">
              <div className="skeleton-box" style={{ width: 40, height: 40, borderRadius: '50%' }} />
              <div className="ccard__nameblock">
                <div className="skeleton-box" style={{ width: 140, height: 16, marginBottom: 6 }} />
                <div className="skeleton-box" style={{ width: 100, height: 12 }} />
              </div>
            </div>
            <div className="ccard__right">
              <div className="skeleton-box" style={{ width: 48, height: 56 }} />
            </div>
          </div>
          <div className="ccard__cats">
            {Array.from({ length: 6 }).map((_, j) => (
              <div key={j} className="skeleton-box" style={{ width: 64, height: 28, borderRadius: 6 }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CityGrid({ cities, allCities, selectedCity, onSelect, sortKey, loading }) {
  if (loading && !cities.length) return <LoadingSkeleton />;

  if (!cities.length) {
    return (
      <div className="city-grid city-grid--empty">
        <p className="city-grid__empty">No cities to show. Try a different filter.</p>
      </div>
    );
  }

  // Build a global rank lookup: cmaCode → 1-based rank within allCities
  const globalRankMap = {};
  allCities.forEach((c, i) => { globalRankMap[c.cmaCode] = i + 1; });

  return (
    <div className="city-grid" role="list" aria-label={`${cities.length} cities`}>
      {cities.map((city, i) => (
        <CityCard
          key={city.cmaCode}
          city={city}
          rank={i + 1}
          globalRank={globalRankMap[city.cmaCode] ?? i + 1}
          selected={selectedCity?.cmaCode === city.cmaCode}
          onSelect={onSelect}
          sortKey={sortKey}
        />
      ))}
    </div>
  );
}
