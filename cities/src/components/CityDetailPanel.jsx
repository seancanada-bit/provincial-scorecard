import { useState } from 'react';
import { gradeFill, gradeColorClass, gradeBgClass, scoreFill, toGrade, PROVINCE_COLORS, PROVINCE_NAMES } from '../utils/grading.js';
import { track } from '../utils/track.js';

const TABS = [
  { key: 'housing',     label: 'Housing',    icon: '🏠' },
  { key: 'safety',      label: 'Safety',     icon: '🛡️' },
  { key: 'fiscal',      label: 'Fiscal',     icon: '💰' },
  { key: 'liveability', label: 'Liveable',   icon: '🌳' },
  { key: 'economic',    label: 'Economic',   icon: '📈' },
  { key: 'community',   label: 'Community',  icon: '🤝' },
];

function MetricRow({ label, score, rawDisplay, compareDisplay }) {
  if (score === null || score === undefined) return null;
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div className="dp-metric">
      <div className="dp-metric__label">{label}</div>
      <div className="dp-metric__track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="dp-metric__fill" style={{ width: `${pct}%`, background: scoreFill(score) }} />
      </div>
      <div className="dp-metric__meta">
        <span className="dp-metric__raw">{rawDisplay}</span>
        {compareDisplay && <span className="dp-metric__compare">{compareDisplay}</span>}
      </div>
    </div>
  );
}

function KeyStat({ value, unit, label, score, grade }) {
  return (
    <div className="dp-keystat">
      <div className="dp-keystat__number">
        <span className="dp-keystat__value">{value}</span>
        {unit && <span className="dp-keystat__unit">{unit}</span>}
      </div>
      <div className="dp-keystat__label">{label}</div>
      {score != null && (
        <div className={`dp-keystat__grade ${gradeBgClass(grade)} ${gradeColorClass(grade)}`}>
          {grade} · {score}/100
        </div>
      )}
    </div>
  );
}

function HousingTab({ c }) {
  const h = c.housing;
  if (!h) return <div className="dp-tab-content"><p className="dp-empty">Housing data not yet available.</p></div>;
  return (
    <div className="dp-tab-content">
      <KeyStat
        value={h.mlsHpiBenchmark != null ? `$${Math.round(h.mlsHpiBenchmark / 1000)}k` : '—'}
        label="MLS benchmark home price"
        score={h.score}
        grade={h.grade}
      />
      <div className="dp-metrics">
        <MetricRow
          label="Housing starts per 1,000 pop"
          score={h.startsScore}
          rawDisplay={h.housingStartsPer1000 != null ? `${h.housingStartsPer1000} starts/1k` : '—'}
          compareDisplay="National median: ~3/1k"
        />
        <MetricRow
          label="Rent-to-income ratio"
          score={h.rentToIncomeScore}
          rawDisplay={h.rentToIncomeRatio != null ? `${h.rentToIncomeRatio}% of income` : '—'}
          compareDisplay="Target: <25% · Stress: >40%"
        />
        <MetricRow
          label="MLS HPI price trend (YoY)"
          score={h.hpiTrendScore}
          rawDisplay={h.mlsHpiYoyPct != null ? `${h.mlsHpiYoyPct > 0 ? '+' : ''}${h.mlsHpiYoyPct}%` : '—'}
          compareDisplay="Cooling = better score"
        />
        <MetricRow
          label="Avg permit approval time"
          score={h.permitScore}
          rawDisplay={h.avgPermitApprovalDays != null ? `${h.avgPermitApprovalDays} days` : '—'}
          compareDisplay="Target: <60 days"
        />
      </div>
      {h.avgRent2br != null && (
        <p className="dp-note">Avg 2BR rent: ${h.avgRent2br.toLocaleString('en-CA')}/mo</p>
      )}
      <p className="dp-source">Source: CMHC · CREA · {h.dataDate ?? '2023'}</p>
    </div>
  );
}

function SafetyTab({ c }) {
  const s = c.safety;
  if (!s) return <div className="dp-tab-content"><p className="dp-empty">Safety data not yet available.</p></div>;
  const trendEmoji = s.csi10yrTrend === 'improving' ? '📉' : s.csi10yrTrend === 'worsening' ? '📈' : null;
  return (
    <div className="dp-tab-content">
      <KeyStat
        value={s.crimeSeverityIndex ?? '—'}
        label="Crime Severity Index (lower = safer)"
        score={s.score}
        grade={s.grade}
      />
      <div className="dp-metrics">
        <MetricRow
          label="Crime Severity Index"
          score={s.csiScore}
          rawDisplay={s.crimeSeverityIndex != null ? `CSI ${s.crimeSeverityIndex}` : '—'}
          compareDisplay="National avg ≈ 73 (2022)"
        />
        <MetricRow
          label="Violent Crime Severity"
          score={s.violentCsiScore}
          rawDisplay={s.violentCsi != null ? `${s.violentCsi}` : '—'}
          compareDisplay="Lower is safer"
        />
      </div>
      {s.csiYoyChangePct != null && (
        <p className="dp-note">YoY change: {s.csiYoyChangePct > 0 ? '+' : ''}{s.csiYoyChangePct}%</p>
      )}
      {s.csi10yrTrend && (
        <p className="dp-note">{trendEmoji} 10-year trend: {s.csi10yrTrend}</p>
      )}
      <p className="dp-source">Source: Statistics Canada POLIS · {s.dataDate ?? '2022'}</p>
    </div>
  );
}

function FiscalTab({ c }) {
  const f = c.fiscal;
  if (!f) return <div className="dp-tab-content"><p className="dp-empty">Fiscal data not yet available.</p></div>;
  return (
    <div className="dp-tab-content">
      <KeyStat
        value={f.propertyTaxRate != null ? `${f.propertyTaxRate}%` : '—'}
        label="residential property tax rate"
        score={f.score}
        grade={f.grade}
      />
      <div className="dp-metrics">
        <MetricRow
          label="Infrastructure spending"
          score={f.infraPctScore}
          rawDisplay={f.infraSpendingPct != null ? `${f.infraSpendingPct}% of budget` : '—'}
          compareDisplay="Target: >20%"
        />
        <MetricRow
          label="Operating surplus/deficit per capita"
          score={f.operatingScore}
          rawDisplay={f.operatingSurplusDeficit != null
            ? `${f.operatingSurplusDeficit >= 0 ? '+' : ''}$${f.operatingSurplusDeficit.toLocaleString('en-CA')}`
            : '—'}
          compareDisplay="Surplus preferred"
        />
        <MetricRow
          label="Net debt per capita"
          score={f.debtScore}
          rawDisplay={f.netDebtPerCapita != null ? `$${f.netDebtPerCapita.toLocaleString('en-CA')}` : '—'}
          compareDisplay="Lower = better"
        />
      </div>
      {f.revenuePerCapita != null && (
        <p className="dp-note">Revenue per capita: ${f.revenuePerCapita.toLocaleString('en-CA')}</p>
      )}
      <p className="dp-source">Source: Municipal budget reports · {f.dataDate ?? '2023'}</p>
    </div>
  );
}

function LiveabilityTab({ c }) {
  const l = c.liveability;
  if (!l) return <div className="dp-tab-content"><p className="dp-empty">Liveability data not yet available for this city.</p></div>;
  return (
    <div className="dp-tab-content">
      <KeyStat
        value={l.avgCommuteMins != null ? `${l.avgCommuteMins}` : '—'}
        unit=" min"
        label="average commute time"
        score={l.score}
        grade={l.grade}
      />
      <div className="dp-metrics">
        <MetricRow
          label="Transit ridership per capita"
          score={l.transitScore}
          rawDisplay={l.transitRidershipPerCapita != null ? `${l.transitRidershipPerCapita} rides/yr` : '—'}
          compareDisplay="Top cities: 100+"
        />
        <MetricRow
          label="Average commute time"
          score={l.commuteScore}
          rawDisplay={l.avgCommuteMins != null ? `${l.avgCommuteMins} minutes` : '—'}
          compareDisplay="Target: <25 min"
        />
        <MetricRow
          label="Air quality (AQHI annual avg)"
          score={l.aqhiScore}
          rawDisplay={l.aqhiAnnualAvg != null ? `AQHI ${l.aqhiAnnualAvg}` : '—'}
          compareDisplay="Lower = cleaner"
        />
        <MetricRow
          label="Parks & rec spending per capita"
          score={l.parksScore}
          rawDisplay={l.parksRecSpendingPerCapita != null ? `$${l.parksRecSpendingPerCapita}/person` : '—'}
          compareDisplay="Nat'l avg: ~$150"
        />
      </div>
      {l.walkabilityScore != null && (
        <p className="dp-note">Walkability score: {l.walkabilityScore}/100</p>
      )}
      <p className="dp-source">Source: Stats Canada · APTA · {l.dataDate ?? '2023'}</p>
    </div>
  );
}

function EconomicTab({ c }) {
  const e = c.economic;
  if (!e) return <div className="dp-tab-content"><p className="dp-empty">Economic data not yet available.</p></div>;
  return (
    <div className="dp-tab-content">
      <KeyStat
        value={e.unemploymentRate != null ? `${e.unemploymentRate}%` : '—'}
        label="unemployment rate"
        score={e.score}
        grade={e.grade}
      />
      <div className="dp-metrics">
        <MetricRow
          label="Unemployment vs national avg"
          score={e.unemployScore}
          rawDisplay={e.unemploymentVsNational != null
            ? `${e.unemploymentVsNational > 0 ? '+' : ''}${e.unemploymentVsNational}pp vs Canada`
            : '—'}
          compareDisplay="Below avg = better"
        />
        <MetricRow
          label="Population growth"
          score={e.popGrowthScore}
          rawDisplay={e.populationGrowthPct != null ? `${e.populationGrowthPct > 0 ? '+' : ''}${e.populationGrowthPct}%/yr` : '—'}
          compareDisplay="Nat'l avg ≈ 1.8%/yr"
        />
        <MetricRow
          label="Median household income vs Canada"
          score={e.incomeScore}
          rawDisplay={e.incomeVsNationalPct != null
            ? `${e.incomeVsNationalPct > 0 ? '+' : ''}${e.incomeVsNationalPct}% vs national`
            : '—'}
          compareDisplay="Higher = better"
        />
      </div>
      {e.medianHouseholdIncome != null && (
        <p className="dp-note">Median household income: ${e.medianHouseholdIncome.toLocaleString('en-CA')}</p>
      )}
      <p className="dp-source">Source: Statistics Canada CENSUS · {e.dataDate ?? '2021'}</p>
    </div>
  );
}

function CommunityTab({ c }) {
  const cm = c.community;
  if (!cm) return <div className="dp-tab-content"><p className="dp-empty">Community data not yet available for this city.</p></div>;
  const trendEmoji = cm.homelessnessTrend === 'improving' ? '📉' : cm.homelessnessTrend === 'worsening' ? '📈' : null;
  return (
    <div className="dp-tab-content">
      <KeyStat
        value={cm.homelessnessPer10k != null ? `${cm.homelessnessPer10k}` : '—'}
        unit=" / 10k"
        label="people experiencing homelessness"
        score={cm.score}
        grade={cm.grade}
      />
      <div className="dp-metrics">
        <MetricRow
          label="Homelessness rate per 10,000"
          score={cm.homelessScore}
          rawDisplay={cm.homelessnessPer10k != null ? `${cm.homelessnessPer10k} per 10k` : '—'}
          compareDisplay="Target: <10 per 10k"
        />
        <MetricRow
          label="Social services spending per capita"
          score={cm.socialScore}
          rawDisplay={cm.socialServicesSpend != null ? `$${cm.socialServicesSpend.toLocaleString('en-CA')}/person` : '—'}
          compareDisplay="Higher = more support"
        />
      </div>
      {cm.homelessnessPitCount != null && (
        <p className="dp-note">PiT count: {cm.homelessnessPitCount.toLocaleString('en-CA')} individuals</p>
      )}
      {cm.homelessnessTrend && (
        <p className="dp-note">{trendEmoji} Trend: {cm.homelessnessTrend}</p>
      )}
      <p className="dp-source">Source: Stats Canada PiT Count · CIHI · {cm.dataDate ?? '2022'}</p>
    </div>
  );
}

const TAB_CONTENT = {
  housing:     HousingTab,
  safety:      SafetyTab,
  fiscal:      FiscalTab,
  liveability: LiveabilityTab,
  economic:    EconomicTab,
  community:   CommunityTab,
};

export default function CityDetailPanel({ city, onClose, sortKey }) {
  const [activeTab, setActiveTab] = useState(
    TABS.find(t => t.key === sortKey)?.key ?? 'housing'
  );

  const color    = PROVINCE_COLORS[city.provinceAbbr] ?? '#555';
  const cats     = city.categories;
  const TabComponent = TAB_CONTENT[activeTab];

  const handleTabChange = key => {
    setActiveTab(key);
    track('city_tab', { city: city.cmaCode, detail: key });
  };

  const duckGrade = city.duckScore != null ? toGrade(city.duckScore) : null;

  return (
    <aside className="city-detail-panel" aria-label={`Details for ${city.name}`}>
      {/* Header */}
      <div className="dp-header" style={{ '--city-color': color }}>
        <button className="dp-close" onClick={onClose} aria-label="Close city details">✕</button>
        <div className="dp-header__badge" style={{ background: color }} aria-hidden="true">
          <span className="dp-header__abbr">{city.provinceAbbr}</span>
        </div>
        <div className="dp-header__text">
          <h2 className="dp-header__name">{city.name}</h2>
          <p className="dp-header__meta">
            {PROVINCE_NAMES[city.provinceAbbr] ?? city.provinceAbbr}
            {city.mayorName && ` · Mayor ${city.mayorName}`}
            {city.population && ` · Pop. ${city.population.toLocaleString('en-CA')}`}
          </p>
        </div>
        <div className="dp-header__scores">
          <div className="dp-header__score-block">
            <span className="dp-header__score-label">performance</span>
            <span className={`dp-header__grade ${gradeColorClass(city.grade)}`}>{city.grade}</span>
            <span className="dp-header__num">{city.composite}/100</span>
          </div>
          {duckGrade && (
            <div className="dp-header__score-block dp-header__score-block--duck">
              <span className="dp-header__score-label">🦆 value</span>
              <span className={`dp-header__grade ${gradeColorClass(duckGrade)}`}>{duckGrade}</span>
              <span className="dp-header__num">{city.duckScore}/100</span>
            </div>
          )}
        </div>
      </div>

      {/* Category score row */}
      <div className="dp-cat-row" role="list" aria-label="Category scores">
        {TABS.map(tab => {
          const cat   = cats[tab.key];
          const score = cat?.score ?? 0;
          const grade = cat?.grade ?? 'N/A';
          return (
            <button
              key={tab.key}
              role="listitem"
              className={`dp-cat-chip${activeTab === tab.key ? ' dp-cat-chip--active' : ''}`}
              style={{ color: gradeFill(grade), background: activeTab === tab.key ? `${gradeFill(grade)}18` : undefined }}
              onClick={() => handleTabChange(tab.key)}
              aria-pressed={activeTab === tab.key}
              aria-label={`${tab.label}: ${score}/100`}
            >
              <span className="dp-cat-chip__icon" aria-hidden="true">{tab.icon}</span>
              <span className="dp-cat-chip__label">{tab.label}</span>
              <span className="dp-cat-chip__score">{score}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="dp-body">
        <TabComponent c={cats} />
      </div>

      {/* Duck score callout */}
      {duckGrade && (
        <div className="dp-duck-callout">
          <span className="dp-duck-callout__emoji" aria-hidden="true">🦆</span>
          <div className="dp-duck-callout__text">
            <strong>Bang for Your Duck: {duckGrade} · {city.duckScore}/100</strong>
            <p>
              Property tax rate of {cats.fiscal?.propertyTaxRate ?? '—'}% — {
                city.duckScore >= 87 ? 'exceptional value for municipal services delivered.' :
                city.duckScore >= 73 ? 'solid value relative to what residents pay.' :
                city.duckScore >= 57 ? 'moderate value — room for improvement.' :
                'below-average value for the taxes paid.'
              }
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
