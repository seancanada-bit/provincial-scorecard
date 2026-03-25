import { useState } from 'react';

const SOURCES = [
  {
    category: 'Housing & Affordability',
    rows: [
      { name: 'CREA MLS Home Price Index (HPI)',         what: 'Benchmark home price and year-over-year % change by CMA', freq: 'Monthly',      how: 'Free public releases, manually updated quarterly' },
      { name: 'CMHC Housing Starts',                     what: 'New residential construction starts per CMA',             freq: 'Monthly',      how: 'CMHC open data portal' },
      { name: 'CMHC Rental Market Report',               what: 'Average 2-bedroom rent by CMA',                          freq: 'Annual',       how: 'Free PDF, manually entered' },
      { name: 'Municipal permit offices',                what: 'Average permit approval days',                           freq: 'Varies',       how: 'Municipal reports, manually entered' },
    ],
  },
  {
    category: 'Safety',
    rows: [
      { name: 'Statistics Canada — Table 35-10-0026-01', what: 'Police-reported Crime Severity Index (CSI) by CMA',      freq: 'Annual',       how: 'Federal data table' },
      { name: 'Statistics Canada — Table 35-10-0026-01', what: 'Violent Crime Severity Index by CMA',                   freq: 'Annual',       how: 'Federal data table' },
    ],
  },
  {
    category: 'Fiscal Management',
    rows: [
      { name: 'Statistics Canada — Municipal Financial Returns (MFIR)', what: 'Revenue, spending, operating surplus/deficit, net debt per capita', freq: 'Annual', how: 'Federal data tables' },
      { name: 'Municipal annual budgets & financial statements', what: 'Infrastructure spending as % of budget', freq: 'Annual', how: 'Free PDFs, manually entered' },
      { name: 'Zoocasa Annual Property Tax Report',       what: 'Residential mill rates by city',                        freq: 'Annual',       how: 'Free public report, verified against municipal finance data' },
      { name: 'Provincial finance ministries',            what: 'Property tax portioning rules (MB 45%, SK 80%)',        freq: 'Ongoing',      how: 'Free public guidance, applied to nominal rates' },
    ],
  },
  {
    category: 'Liveability',
    rows: [
      { name: 'Statistics Canada Census — journey to work', what: 'Average commute time by CMA',                         freq: 'Quinquennial', how: 'Federal Census data (Table 98-400-X)' },
      { name: 'Transit agency annual reports',            what: 'Annual ridership per capita by CMA',                   freq: 'Annual',       how: 'Free PDFs, manually entered per agency' },
      { name: 'Environment & Climate Change Canada — AQHI', what: 'Annual average Air Quality Health Index by station', freq: 'Annual',       how: 'ECCC open data' },
      { name: 'Municipal parks & recreation budgets',     what: 'Parks spending per capita',                            freq: 'Annual',       how: 'Free PDFs, manually entered' },
    ],
  },
  {
    category: 'Economic Vitality',
    rows: [
      { name: 'Statistics Canada Labour Force Survey (LFS)', what: 'CMA unemployment rate vs. national average',        freq: 'Monthly',      how: 'Federal REST API' },
      { name: 'Statistics Canada Census — income data',  what: 'Median household income by CMA vs. national',          freq: 'Quinquennial', how: 'Federal Census data' },
      { name: 'Statistics Canada — population estimates', what: 'CMA population growth rate',                          freq: 'Annual',       how: 'Federal data table' },
    ],
  },
  {
    category: 'Community Investment',
    rows: [
      { name: 'Canadian Alliance to End Homelessness (CAEH) — Point-in-Time counts', what: 'Homelessness count per 10,000 population by CMA', freq: 'Biennial', how: 'Free public reports, manually entered' },
      { name: 'Municipal budgets — social services',     what: 'Social services spending per capita',                  freq: 'Annual',       how: 'Free PDFs, manually entered' },
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
          Property tax rates are the most frequently revised figure: rates vary by year, and Manitoba and
          Saskatchewan require portioning adjustments to be comparable with other provinces. If you spot
          an error or have a more current source, please reach out — accuracy matters more than speed here.
        </div>
      </div>
    </section>
  );
}
