export default function SortTabs({ sortKey, onChange, tabs }) {
  return (
    <nav className="sort-tabs" aria-label="Sort ridings by category">
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
      </div>
    </nav>
  );
}
