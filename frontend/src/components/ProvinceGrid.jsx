import { PROVINCE_COLORS, gradeFill, gradeColorClass } from '../utils/grading.js';

export default function ProvinceGrid({ provinces, selectedCode, onSelect }) {
  return (
    <div className="prov-grid" role="list" aria-label="All provinces at a glance">
      {provinces.map(p => {
        const color = PROVINCE_COLORS[p.code] ?? '#333';
        const isSelected = p.code === selectedCode;
        return (
          <button
            key={p.code}
            className={`prov-grid__cell${isSelected ? ' prov-grid__cell--selected' : ''}`}
            style={{ '--prov-color': color, '--grade-color': gradeFill(p.grade) }}
            onClick={() => onSelect(p.code)}
            role="listitem"
            aria-pressed={isSelected}
            aria-label={`${p.name}: ${p.grade}, ${p.composite} out of 100`}
          >
            <span className="prov-grid__code">{p.code}</span>
            <span className={`prov-grid__grade ${gradeColorClass(p.grade)}`}>{p.grade}</span>
            <span className="prov-grid__score">{p.composite}</span>
          </button>
        );
      })}
    </div>
  );
}
