import { useState } from 'react';

const PROV_NAMES = {
  BC: 'British Columbia',
  AB: 'Alberta',
  SK: 'Saskatchewan',
  MB: 'Manitoba',
  ON: 'Ontario',
  QC: 'Québec',
  NB: 'New Brunswick',
  NS: 'Nova Scotia',
  PE: 'PEI',
  NL: 'Newfoundland & Labrador',
};

const TAB_LABELS = {
  healthcare:     'Healthcare',
  housing:        'Housing',
  fiscal:         'Fiscal',
  infrastructure: 'Infrastructure',
  economy:        'Economy',
  education:      'Education',
  safety:         'Safety',
  mentalhealth:   'Mental Health',
  ltc:            'Long-Term Care',
  purchasing:     'Purchasing Power',
};

const API = import.meta.env.VITE_API_URL ?? '';

function BarList({ items, labelMap }) {
  if (!items?.length) return <p className="sa-empty">No data yet — check back soon.</p>;
  const max = items[0].count;
  return (
    <ol className="sa-list">
      {items.map(({ name, count }, i) => (
        <li key={name} className="sa-row">
          <span className="sa-label">{labelMap?.[name] ?? name}</span>
          <span className="sa-bar-wrap" aria-hidden="true">
            <span
              className="sa-bar"
              style={{
                width: `${Math.round((count / max) * 100)}%`,
                opacity: i === 0 ? 1 : Math.max(0.35, 1 - i * 0.12),
              }}
            />
          </span>
          <span className="sa-count">{count.toLocaleString()}</span>
        </li>
      ))}
    </ol>
  );
}

export default function SiteActivity() {
  const [open, setOpen]       = useState(false);
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);

  function toggle() {
    // Lazy-load on first open
    if (!open && !data) {
      setLoading(true);
      fetch(`${API}/api/stats`)
        .then(r => r.json())
        .then(d => { setData(d); setLoading(false); })
        .catch(() => setLoading(false));
    }
    setOpen(o => !o);
  }

  const hasData = data && (data.topProvinces?.length || data.topTabs?.length);

  return (
    <section className="site-activity">
      <button
        className="sa-toggle"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="sa-body"
      >
        <span className="sa-toggle__label">What Canadians are exploring</span>
        <span className="sa-toggle__chevron" aria-hidden="true">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className="sa-body" id="sa-body">
          {loading && <p className="sa-empty">Loading…</p>}

          {!loading && data && (
            <>
              {hasData ? (
                <div className="sa-cols">
                  <div className="sa-col">
                    <h4 className="sa-col__title">Most explored provinces</h4>
                    <BarList items={data.topProvinces} labelMap={PROV_NAMES} />
                  </div>
                  <div className="sa-col">
                    <h4 className="sa-col__title">Most viewed topics</h4>
                    <BarList items={data.topTabs} labelMap={TAB_LABELS} />
                  </div>
                </div>
              ) : (
                <p className="sa-empty">No activity recorded yet — check back soon.</p>
              )}

              {data.total > 0 && (
                <p className="sa-footer">
                  Based on {data.total.toLocaleString()} interactions · past 90 days
                </p>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
