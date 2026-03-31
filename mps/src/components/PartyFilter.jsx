const PARTIES = [
  { key: 'ALL',              label: 'All Parties' },
  { key: 'Liberal',          label: 'Liberal',     short: 'LPC' },
  { key: 'Conservative',     label: 'Conservative',short: 'CPC' },
  { key: 'NDP',              label: 'NDP',         short: 'NDP' },
  { key: 'Bloc Québécois',   label: 'Bloc',        short: 'BQ'  },
  { key: 'Green Party',      label: 'Green',       short: 'GPC' },
  { key: 'Independent',      label: 'Ind.',        short: 'Ind' },
];

export default function PartyFilter({ active, onChange, colors }) {
  return (
    <div className="party-filter" role="group" aria-label="Filter by party">
      {PARTIES.map(p => {
        const isActive = active === p.key;
        const dotColor = p.key !== 'ALL' ? colors[p.key] : undefined;
        return (
          <button
            key={p.key}
            className={`party-filter__pill${isActive ? ' party-filter__pill--active' : ''}`}
            style={isActive && dotColor ? { borderColor: dotColor, background: `${dotColor}15` } : undefined}
            onClick={() => onChange(p.key)}
            aria-pressed={isActive}
          >
            {dotColor && <span className="party-filter__dot" style={{ background: dotColor }} />}
            {p.short ?? p.label}
          </button>
        );
      })}
    </div>
  );
}
