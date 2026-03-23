const TABS = [
  { key: 'overall',        label: 'Overall' },
  { key: 'healthcare',     label: 'Healthcare' },
  { key: 'housing',        label: 'Housing' },
  { key: 'fiscal',         label: 'Fiscal' },
  { key: 'infrastructure', label: 'Infrastructure' },
  { key: 'economy',        label: 'Economy' },
  { key: 'education',      label: 'Education' },
  { key: 'safety',         label: 'Safety' },
  { key: 'mentalhealth',   label: 'Mental Health' },
  { key: 'value',          label: '🦆 Duck Score', title: 'Performance per tax dollar — the more you get for what you pay, the higher the Duck Score' },
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
