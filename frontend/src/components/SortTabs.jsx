const TABS = [
  { key: 'overall',        label: 'Overall' },
  { key: 'healthcare',     label: 'Healthcare' },
  { key: 'housing',        label: 'Housing' },
  { key: 'fiscal',         label: 'Fiscal' },
  { key: 'infrastructure', label: 'Infra' },
  { key: 'economy',        label: 'Economy' },
  { key: 'education',      label: 'Education' },
  { key: 'value',          label: '$ Value',   title: 'Score ÷ tax burden — who gives you the most for your dollar' },
];

export default function SortTabs({ active, onChange }) {
  return (
    <nav className="sort-tabs" aria-label="Sort provinces by category">
      <div className="sort-tabs__inner" role="tablist">
        {TABS.map(tab => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={active === tab.key}
            className={`sort-tabs__tab${active === tab.key ? ' sort-tabs__tab--active' : ''}`}
            onClick={() => onChange(tab.key)}
            title={tab.title}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
