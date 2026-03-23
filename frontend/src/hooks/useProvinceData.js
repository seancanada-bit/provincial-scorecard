import { useState, useEffect } from 'react';
import fallback from '../data/fallback.json';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Provides province data.
 *
 * - Returns bundled fallback.json instantly (no loading spinner, page is
 *   immediately usable with the last-generated dataset).
 * - If VITE_API_URL is set, silently fetches fresh data from the Render API
 *   in the background and swaps it in when ready.
 * - Any API failure is silently swallowed — the bundled data remains.
 */
export function useProvinceData() {
  const [data, setData] = useState(fallback);

  useEffect(() => {
    if (!API_URL) return;
    fetch(`${API_URL}/api/data`)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(json => setData(json))
      .catch(() => { /* stay on bundled data */ });
  }, []);

  return { data };
}
