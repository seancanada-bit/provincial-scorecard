const TABS = [
  { key: 'value',          label: 'Value',          icon: '🦆' },
  { key: 'overall',        label: 'Overall',        icon: '🏆' },
  { key: 'healthcare',     label: 'Healthcare',     icon: '🏥' },
  { key: 'housing',        label: 'Housing',        icon: '🏠' },
  { key: 'fiscal',         label: 'Fiscal',         icon: '💰' },
  { key: 'infrastructure', label: 'Infrastructure', icon: '🏗️' },
  { key: 'economy',        label: 'Economy',        icon: '📈' },
  { key: 'education',      label: 'Education',      icon: '🎓' },
  { key: 'safety',         label: 'Safety',         icon: '🛡️' },
  { key: 'mentalhealth',   label: 'Mental Health',  icon: '🧠' },
  { key: 'ltc',            label: 'Long-Term Care', icon: '🏡' },
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
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
