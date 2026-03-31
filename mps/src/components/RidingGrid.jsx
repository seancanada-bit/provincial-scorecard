import RidingCard from './RidingCard.jsx';

function LoadingSkeleton() {
  return (
    <div className="city-grid" aria-busy="true" aria-label="Loading ridings…">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="ccard ccard--skeleton" aria-hidden="true">
          <div className="ccard__main">
            <div className="ccard__left">
              <div className="skeleton-box" style={{ width: 40, height: 40, borderRadius: '50%' }} />
              <div className="ccard__nameblock">
                <div className="skeleton-box" style={{ width: 160, height: 16, marginBottom: 6 }} />
                <div className="skeleton-box" style={{ width: 120, height: 12 }} />
              </div>
            </div>
            <div className="ccard__right">
              <div className="skeleton-box" style={{ width: 48, height: 56 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RidingGrid({ ridings, allRidings, selectedRiding, onSelect, sortKey, loading, partyColors }) {
  if (loading && !ridings.length) return <LoadingSkeleton />;

  if (!ridings.length) {
    return (
      <div className="city-grid city-grid--empty">
        <p className="city-grid__empty">No ridings to show. Try a different filter.</p>
      </div>
    );
  }

  const globalRankMap = {};
  allRidings.forEach((r, i) => { globalRankMap[r.ridingCode] = i + 1; });

  return (
    <div className="city-grid" role="list" aria-label={`${ridings.length} ridings`}>
      {ridings.map((riding, i) => (
        <RidingCard
          key={riding.ridingCode}
          riding={riding}
          rank={i + 1}
          globalRank={globalRankMap[riding.ridingCode] ?? i + 1}
          selected={selectedRiding?.ridingCode === riding.ridingCode}
          onSelect={onSelect}
          sortKey={sortKey}
          partyColors={partyColors}
        />
      ))}
    </div>
  );
}
