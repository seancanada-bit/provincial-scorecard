/**
 * Statistics Canada API fetcher.
 * Fetches the most recent period only from each required table.
 * Called once per 24h by the cache refresh cycle.
 *
 * Tables:
 *   10-10-0017-01  Provincial fiscal balances (GFS)
 *   36-10-0222-01  Provincial GDP
 *   14-10-0287-01  Provincial unemployment rate
 *   17-10-0009-01  Population estimates
 *   18-10-0205-01  New housing price index (rent component used for CPI rent)
 */

const axios = require('axios');

const BASE = 'https://www150.statcan.gc.ca/t1/tbl1/en/dtbl';

// Province code mapping: Stats Canada GEO IDs → our province codes
const GEO_MAP = {
  '59': 'BC',  // British Columbia
  '48': 'AB',  // Alberta
  '47': 'SK',  // Saskatchewan
  '46': 'MB',  // Manitoba
  '35': 'ON',  // Ontario
  '24': 'QC',  // Quebec
  '13': 'NB',  // New Brunswick
  '12': 'NS',  // Nova Scotia
  '11': 'PE',  // Prince Edward Island
  '10': 'NL',  // Newfoundland and Labrador
};

// Province names for the GEO lookup
const GEO_NAMES = {
  'British Columbia': 'BC',
  'Alberta': 'AB',
  'Saskatchewan': 'SK',
  'Manitoba': 'MB',
  'Ontario': 'ON',
  'Quebec': 'QC',
  'New Brunswick': 'NB',
  'Nova Scotia': 'NS',
  'Prince Edward Island': 'PE',
  'Newfoundland and Labrador': 'NL',
};

async function fetchTable(tableId, { vectorIds } = {}) {
  try {
    // Use the getDataFromCubePidCoordAndLatestNPeriods endpoint - fetch latest 4 periods
    const id = tableId.replace(/-/g, '');
    const url = `https://www150.statcan.gc.ca/t1/tbl1/en/dtbl!downloadTbl?fileType=JSON&pid=${id}`;
    // Use the series/latest endpoint instead
    const apiUrl = `https://www150.statcan.gc.ca/t1/tbl1/en/dtbl/v1/latestN/4`;
    const resp = await axios.get(
      `https://www150.statcan.gc.ca/t1/tbl1/en/dtbl/v1/latestNData?id=${id}&n=4`,
      { timeout: 15000 }
    );
    return resp.data;
  } catch (err) {
    console.warn(`Stats Canada table ${tableId} fetch failed: ${err.message}`);
    return null;
  }
}

// Alternative: use the WDS REST API
async function fetchStatCanSeries(productId, coordinateId) {
  try {
    const cleanId = productId.replace(/-/g, '');
    const url = `https://www150.statcan.gc.ca/t1/tbl1/en/dtbl/v1/latestNData?id=${cleanId}&coordinate=${coordinateId}&n=8`;
    const resp = await axios.get(url, { timeout: 15000 });
    return resp.data;
  } catch (err) {
    return null;
  }
}

/**
 * Main export: returns a per-province object with Stats Canada derived metrics.
 * Falls back to null values if API is unavailable.
 */
async function fetchStatsCanadaData() {
  const result = {};
  for (const code of Object.values(GEO_MAP)) {
    result[code] = {
      unemployment_rate: null,
      unemployment_delta_from_national: null,
      gdp_growth_pct: null,
      gdp_growth_delta_from_national: null,
      population: null,
      budget_balance_pct_gdp: null,
      debt_interest_cents_per_dollar: null,
      net_debt_per_capita: null,
      nhpi_yoy_pct: null,
    };
  }

  // Attempt to fetch unemployment (14-10-0287-01)
  try {
    const unemployUrl = 'https://www150.statcan.gc.ca/t1/tbl1/en/dtbl/v1/latestNData?id=14100287&n=4';
    const resp = await axios.get(unemployUrl, { timeout: 15000 });
    const data = resp.data;
    // Parse response - Stats Canada returns array of series objects
    if (Array.isArray(data)) {
      const national = data.find(s => s.geoDesc === 'Canada');
      const natRate = national?.datapointsPeriod?.[0]?.value ?? null;
      for (const series of data) {
        const prov = GEO_NAMES[series.geoDesc];
        if (prov && series.datapointsPeriod?.[0]?.value) {
          const rate = parseFloat(series.datapointsPeriod[0].value);
          result[prov].unemployment_rate = rate;
          if (natRate) result[prov].unemployment_delta_from_national = Math.round((rate - parseFloat(natRate)) * 10) / 10;
        }
      }
    }
  } catch (err) {
    console.warn('Stats Canada unemployment fetch failed:', err.message);
  }

  // Attempt to fetch GDP (36-10-0222-01)
  try {
    const gdpUrl = 'https://www150.statcan.gc.ca/t1/tbl1/en/dtbl/v1/latestNData?id=36100222&n=8';
    const resp = await axios.get(gdpUrl, { timeout: 15000 });
    const data = resp.data;
    if (Array.isArray(data)) {
      const national = data.find(s => s.geoDesc === 'Canada');
      const natGrowth = computeGrowth(national?.datapointsPeriod);
      for (const series of data) {
        const prov = GEO_NAMES[series.geoDesc];
        if (prov && series.datapointsPeriod?.length >= 2) {
          const growth = computeGrowth(series.datapointsPeriod);
          result[prov].gdp_growth_pct = growth;
          if (natGrowth !== null) result[prov].gdp_growth_delta_from_national = Math.round((growth - natGrowth) * 10) / 10;
        }
      }
    }
  } catch (err) {
    console.warn('Stats Canada GDP fetch failed:', err.message);
  }

  // Attempt to fetch population (17-10-0009-01)
  try {
    const popUrl = 'https://www150.statcan.gc.ca/t1/tbl1/en/dtbl/v1/latestNData?id=17100009&n=4';
    const resp = await axios.get(popUrl, { timeout: 15000 });
    const data = resp.data;
    if (Array.isArray(data)) {
      for (const series of data) {
        const prov = GEO_NAMES[series.geoDesc];
        if (prov && series.datapointsPeriod?.[0]?.value) {
          result[prov].population = parseInt(series.datapointsPeriod[0].value.replace(/,/g, ''), 10);
        }
      }
    }
  } catch (err) {
    console.warn('Stats Canada population fetch failed:', err.message);
  }

  return result;
}

function computeGrowth(periods) {
  if (!periods || periods.length < 2) return null;
  const latest = parseFloat(periods[0]?.value);
  const prev   = parseFloat(periods[1]?.value);
  if (isNaN(latest) || isNaN(prev) || prev === 0) return null;
  return Math.round(((latest - prev) / prev) * 1000) / 10; // one decimal
}

module.exports = { fetchStatsCanadaData };
