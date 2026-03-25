export default function SortTabs({ sortKey, onChange, tabs, mapView, onToggleMap }) {
  return (
    <nav className="sort-tabs" aria-label="Sort cities by category">
      <div className="sort-tabs__inner" role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={sortKey === tab.key}
            className={`sort-tabs__tab${sortKey === tab.key ? ' sort-tabs__tab--active' : ''}`}
            onClick={() => onChange(tab.key)}
          >
            {tab.icon ? `${tab.icon} ${tab.label}` : tab.label}
          </button>
        ))}
        <button
          className={`sort-tabs__tab sort-tabs__tab--map${mapView ? ' sort-tabs__tab--active' : ''}`}
          onClick={onToggleMap}
          aria-pressed={mapView}
          title={mapView ? 'Hide map' : 'Show map'}
        >
          {mapView ? '📋 List' : '🗺️ Map'}
        </button>
      </div>
    </nav>
  );
}
