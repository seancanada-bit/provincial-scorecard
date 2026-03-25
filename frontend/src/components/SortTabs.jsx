const TABS = [
  { key: 'overall',        label: 'Performance',    title: 'Overall composite score across all 9 categories' },
  { key: 'value',          label: '🦆 Value',        title: 'Bang for your duck — performance relative to tax burden' },
  { key: 'healthcare',     label: 'Healthcare' },
  { key: 'housing',        label: 'Housing' },
  { key: 'fiscal',         label: 'Fiscal' },
  { key: 'infrastructure', label: 'Infrastructure' },
  { key: 'economy',        label: 'Economy' },
  { key: 'education',      label: 'Education' },
  { key: 'safety',         label: 'Safety' },
  { key: 'mentalhealth',   label: 'Mental Health' },
  { key: 'ltc',            label: 'Long-Term Care' },
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
