import { PROVINCE_NAMES } from '../utils/grading.js';

const PROVINCES = ['BC', 'AB', 'SK', 'MB', 'ON', 'QC', 'NB', 'NS', 'PE', 'NL'];

export default function ProvinceFilter({ active, onChange }) {
  return (
    <nav className="province-filter" aria-label="Filter by province">
      <div className="province-filter__inner" role="tablist">
        <button
          role="tab"
          aria-selected={active === 'ALL'}
          className={`province-filter__tab${active === 'ALL' ? ' province-filter__tab--active' : ''}`}
          onClick={() => onChange('ALL')}
        >
          All Provinces
        </button>
        {PROVINCES.map(abbr => (
          <button
            key={abbr}
            role="tab"
            aria-selected={active === abbr}
            aria-label={PROVINCE_NAMES[abbr]}
            className={`province-filter__tab${active === abbr ? ' province-filter__tab--active' : ''}`}
            onClick={() => onChange(abbr)}
            title={PROVINCE_NAMES[abbr]}
          >
            {abbr}
          </button>
        ))}
      </div>
    </nav>
  );
}
