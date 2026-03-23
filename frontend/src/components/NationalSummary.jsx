import { useState, useEffect } from 'react';
import { PROVINCE_COLORS } from '../utils/grading.js';

const TAKEAWAYS = [
  n => `Canadian provinces average ${n.avgComposite}/100 overall — with a ${n.avgHealthcare}/100 average on healthcare delivery.`,
  n => `Housing affordability is the toughest challenge nationally, averaging just ${n.avgHousing}/100 across all provinces.`,
  n => `Fiscal responsibility varies widely: some provinces are in surplus while others spend cents on the dollar to service debt.`,
  n => `Infrastructure delivery scored an average of ${n.avgInfrastructure}/100 — major projects in several provinces are significantly over budget and behind schedule.`,
];

export default function NationalSummary({ national, provinces }) {
  const [takeawayIdx, setTakeawayIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTakeawayIdx(i => (i + 1) % TAKEAWAYS.length), 6000);
    return () => clearInterval(id);
  }, []);

  if (!national || !provinces) return null;

  const top = provinces.find(p => p.code === national.topProvince);
  const bot = provinces.find(p => p.code === national.bottomProvince);

  return (
    <div className="national-summary" role="region" aria-label="National summary">
      <div className="national-summary__inner">
        <div className="national-summary__stat">
          <span className="national-summary__label">Canada average</span>
          <span className="national-summary__value">{national.avgComposite}<small style={{ fontSize: '14px', opacity: 0.6 }}>/100</small></span>
        </div>

        <div className="national-summary__divider" aria-hidden="true" />

        {top && (
          <div className="national-summary__stat">
            <span className="national-summary__label">Top ranked</span>
            <span
              className="national-summary__value--small"
              style={{ color: PROVINCE_COLORS[top.code] ? '#7FDBBD' : '#fff' }}
            >
              {top.name}
            </span>
          </div>
        )}

        <div className="national-summary__divider" aria-hidden="true" />

        {bot && (
          <div className="national-summary__stat">
            <span className="national-summary__label">Lowest ranked</span>
            <span className="national-summary__value--small" style={{ color: '#FFAB91' }}>
              {bot.name}
            </span>
          </div>
        )}

        <p className="national-summary__takeaway" aria-live="polite">
          {TAKEAWAYS[takeawayIdx](national)}
        </p>
      </div>
    </div>
  );
}
