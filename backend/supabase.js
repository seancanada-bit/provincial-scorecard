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

  const [meta, healthcare, housing, credit, polling, governance, infrastructure, supporters, education, taxes, safety] = await Promise.all([
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
  };
}

module.exports = { fetchAllSupabaseData };
