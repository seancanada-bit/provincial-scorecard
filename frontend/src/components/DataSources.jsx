import { useState } from 'react';

const SOURCES = [
  {
    category: 'Healthcare',
    rows: [
      { name: 'Fraser Institute "Waiting Your Turn"', what: 'Provincial surgical wait times by specialty', freq: 'Annual', how: 'Free PDF, manually entered' },
      { name: 'CIHI — NACRS / Discharge Abstract DB', what: 'ER wait times, surgical benchmarks, primary care attachment', freq: 'Annual', how: 'Free data tables, manually entered' },
    ],
  },
  {
    category: 'Housing',
    rows: [
      { name: 'CREA MLS Home Price Index', what: 'Benchmark home prices and year-over-year change by province', freq: 'Monthly', how: 'Free public releases, manually updated quarterly' },
      { name: 'CMHC Housing Starts', what: 'New construction starts per province', freq: 'Monthly', how: 'CMHC open data portal, via Supabase' },
      { name: 'Statistics Canada — Table 18-10-0205-01', what: 'New Housing Price Index (rent component)', freq: 'Monthly', how: 'Federal REST API, fetched every 24 hours' },
    ],
  },
  {
    category: 'Fiscal',
    rows: [
      { name: 'Statistics Canada — Table 10-10-0017-01', what: 'Provincial fiscal balances (GFS)', freq: 'Quarterly', how: 'Federal REST API, fetched every 24 hours' },
      { name: 'Statistics Canada — Table 36-10-0222-01', what: 'Provincial GDP by industry', freq: 'Quarterly', how: 'Federal REST API, fetched every 24 hours' },
      { name: 'Department of Finance Canada — Fiscal Reference Tables', what: 'Historical fiscal data and debt stock', freq: 'Annual', how: 'Free PDF/Excel download, manually entered' },
    ],
  },
  {
    category: 'Infrastructure',
    rows: [
      { name: 'Provincial Auditor General annual reports', what: 'Clean / qualified / adverse audit opinion; major project reviews', freq: 'Annual', how: 'Free PDFs, manually entered' },
      { name: 'Provincial budget documents & capital plans', what: 'Original and revised budgets and timelines for major projects', freq: 'Annual or as published', how: 'Free PDFs, manually entered' },
    ],
  },
  {
    category: 'Economy & Governance',
    rows: [
      { name: 'Statistics Canada — Table 14-10-0287-01', what: 'Provincial unemployment rate', freq: 'Monthly', how: 'Federal REST API, fetched every 24 hours' },
      { name: 'Statistics Canada — Table 17-10-0009-01', what: 'Provincial population estimates', freq: 'Quarterly', how: 'Federal REST API, fetched every 24 hours' },
      { name: "Moody's Investors Service", what: "Provincial credit ratings and outlooks", freq: 'Semi-annual', how: 'Free public rating pages, manually entered' },
      { name: 'Morningstar DBRS', what: 'Provincial credit ratings and outlooks', freq: 'Semi-annual', how: 'Free public rating pages, manually entered' },
      { name: 'S&P Global Ratings', what: 'Provincial credit ratings and outlooks', freq: 'Semi-annual', how: 'Free public rating pages, manually entered' },
      { name: 'Fitch Ratings', what: 'Provincial credit ratings and outlooks', freq: 'Semi-annual', how: 'Free public rating pages, manually entered' },
      { name: 'Angus Reid Institute', what: 'Premier approval ratings', freq: 'Quarterly (approx)', how: 'Free public releases, manually entered' },
      { name: '338Canada (Philippe J. Fournier)', what: 'Voting intention aggregation by province', freq: 'Ongoing', how: 'Free public data, manually entered' },
    ],
  },
];

export default function DataSources() {
  const [open, setOpen] = useState(false);

  return (
    <section className="data-sources" aria-labelledby="sources-heading">
      <h2 className="data-sources__header" id="sources-heading">Where this data comes from</h2>
      <p className="data-sources__sub">
        Every number on this site traces back to a public source. Here's exactly what we use and how often it's updated.
      </p>

      <button
        className="data-sources__toggle"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls="sources-table-wrap"
      >
        {open ? '▾ Hide data sources' : '▸ Show data sources'}
      </button>

      <div id="sources-table-wrap" className={`sources-table-wrap${open ? ' sources-table-wrap--open' : ''}`}>
        {SOURCES.map(cat => (
          <div key={cat.category} style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {cat.category}
            </h3>
            <table className="sources-table" aria-label={`${cat.category} data sources`}>
              <thead>
                <tr>
                  <th>Source</th>
                  <th>What it provides</th>
                  <th>Update frequency</th>
                  <th>How accessed</th>
                </tr>
              </thead>
              <tbody>
                {cat.rows.map(row => (
                  <tr key={row.name}>
                    <td className="sources-table__name">{row.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{row.what}</td>
                    <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{row.freq}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{row.how}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        <div className="sources-note">
          Most of the healthcare, housing, credit, and infrastructure data is updated manually by the site
          maintainer from publicly available reports. This is a one-person project. If you notice outdated
          or incorrect data, please get in touch — accuracy matters more than speed here.
        </div>
      </div>

    </section>
  );
}
