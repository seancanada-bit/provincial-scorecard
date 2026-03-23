import fallback from '../data/fallback.json';

/**
 * Provides province data from the bundled fallback.json.
 *
 * Data is always available instantly — no loading state, no API call.
 * To refresh the data, run: node backend/generate.js
 * (or trigger the "Refresh data" GitHub Actions workflow)
 */
export function useProvinceData() {
  return { data: fallback };
}
