/**
 * Supabase client and data fetcher.
 * Called once per 24h by the cache refresh cycle.
 */

const { createClient } = require('@supabase/supabase-js');

let supabase = null;

function getClient() {
  if (!supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY env vars required');
    supabase = createClient(url, key);
  }
  return supabase;
}

async function fetchAllSupabaseData() {
  const sb = getClient();

  const [meta, healthcare, housing, credit, polling, governance, infrastructure, supporters, education, taxes, safety, statscan, costOfLiving, mentalHealth, ltcData, fiscalData] = await Promise.all([
    sb.from('provinces_meta').select('*'),
    sb.from('provinces_healthcare').select('*'),
    sb.from('provinces_housing').select('*'),
    sb.from('provinces_credit').select('*'),
    sb.from('provinces_polling').select('*'),
    sb.from('provinces_governance').select('*'),
    sb.from('infrastructure_projects').select('*'),
    sb.from('supporters').select('display_name, tier').eq('active', true).order('added_date'),
    sb.from('provinces_education').select('*'),
    sb.from('provinces_tax').select('*'),
    sb.from('provinces_safety').select('*'),
    sb.from('provinces_statscan').select('*'),
    sb.from('provinces_cost_of_living').select('*'),
    sb.from('provinces_mental_health').select('*'),
    sb.from('provinces_ltc').select('*'),
    sb.from('provinces_fiscal').select('*'),
  ]);

  // Check for errors (education + taxes are optional — log but don't throw)
  for (const [name, result] of [
    ['meta', meta], ['healthcare', healthcare], ['housing', housing],
    ['credit', credit], ['polling', polling], ['governance', governance],
    ['infrastructure', infrastructure], ['supporters', supporters],
  ]) {
    if (result.error) throw new Error(`Supabase error on ${name}: ${result.error.message}`);
  }
  if (education.error) console.warn('provinces_education not yet populated:', education.error.message);
  if (taxes.error)     console.warn('provinces_tax not yet populated:',     taxes.error.message);
  if (safety.error)    console.warn('provinces_safety not yet populated:',  safety.error.message);
  if (statscan.error)     console.warn('provinces_statscan not yet populated:', statscan.error.message);
  if (costOfLiving.error)  console.warn('provinces_cost_of_living not yet populated:', costOfLiving.error.message);
  if (mentalHealth.error)  console.warn('provinces_mental_health not yet populated:', mentalHealth.error.message);
  if (ltcData.error)       console.warn('provinces_ltc not yet populated:', ltcData.error.message);
  if (fiscalData.error)    console.warn('provinces_fiscal not yet populated:', fiscalData.error.message);

  // Index by province_code for easy lookup
  const byCode = key => arr => arr.reduce((acc, row) => { acc[row.province_code] = row; return acc; }, {});
  const byCodeMulti = arr => arr.reduce((acc, row) => {
    if (!acc[row.province_code]) acc[row.province_code] = [];
    acc[row.province_code].push(row);
    return acc;
  }, {});

  return {
    meta:           meta.data,
    healthcare:     byCode('province_code')(healthcare.data),
    housing:        byCode('province_code')(housing.data),
    credit:         byCode('province_code')(credit.data),
    polling:        byCode('province_code')(polling.data),
    governance:     byCode('province_code')(governance.data),
    infrastructure: byCodeMulti(infrastructure.data),
    supporters:     supporters.data,
    education:      education.data ? byCode('province_code')(education.data) : {},
    taxes:          taxes.data     ? byCode('province_code')(taxes.data)     : {},
    safety:         safety.data    ? byCode('province_code')(safety.data)    : {},
    statscan:       statscan.data      ? byCode('province_code')(statscan.data)      : {},
    costOfLiving:   costOfLiving.data  ? byCode('province_code')(costOfLiving.data)  : {},
    mentalHealth:   mentalHealth.data  ? byCode('province_code')(mentalHealth.data)  : {},
    ltc:            ltcData.data       ? byCode('province_code')(ltcData.data)        : {},
    fiscal:         fiscalData.data    ? byCode('province_code')(fiscalData.data)     : {},
  };
}

async function fetchAllCitiesData() {
  const sb = getClient();

  const [meta, housing, safety, fiscal, liveability, economic, community, infrastructure] = await Promise.all([
    sb.from('cities_meta').select('*'),
    sb.from('cities_housing').select('*'),
    sb.from('cities_safety').select('*'),
    sb.from('cities_fiscal').select('*'),
    sb.from('cities_liveability').select('*'),
    sb.from('cities_economic').select('*'),
    sb.from('cities_community').select('*'),
    sb.from('cities_infrastructure_projects').select('*'),
  ]);

  if (meta.error) throw new Error(`Supabase error on cities_meta: ${meta.error.message}`);

  const byCode  = key => arr => (arr ?? []).reduce((acc, row) => { acc[row[key]] = row; return acc; }, {});
  const byCodeMulti = (arr, key) => (arr ?? []).reduce((acc, row) => {
    if (!acc[row[key]]) acc[row[key]] = [];
    acc[row[key]].push(row);
    return acc;
  }, {});

  return {
    meta:           meta.data,
    housing:        housing.data     ? byCode('cma_code')(housing.data)     : {},
    safety:         safety.data      ? byCode('cma_code')(safety.data)      : {},
    fiscal:         fiscal.data      ? byCode('cma_code')(fiscal.data)      : {},
    liveability:    liveability.data ? byCode('cma_code')(liveability.data) : {},
    economic:       economic.data    ? byCode('cma_code')(economic.data)    : {},
    community:      community.data   ? byCode('cma_code')(community.data)   : {},
    infrastructure: byCodeMulti(infrastructure.data, 'cma_code'),
  };
}

module.exports = { fetchAllSupabaseData, fetchAllCitiesData, getSupabaseClient: getClient };
