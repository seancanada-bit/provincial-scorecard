import { useState, useEffect } from 'react';
import fallback from '../data/fallback.json';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const SESSION_KEY = 'psc_data_v1';

export function useProvinceData() {
  // Start with bundled fallback — never a loading screen
  const [data, setData] = useState(() => {
    try {
      const cached = sessionStorage.getItem(SESSION_KEY);
      if (cached) return JSON.parse(cached);
    } catch { /* ignore */ }
    return fallback;
  });

  useEffect(() => {
    // Silently fetch fresh data from API in the background
    fetch(`${API_URL}/api/data`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(json => {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(json));
        setData(json);
      })
      .catch(() => {
        // API unavailable — fallback already showing, nothing to do
      });
  }, []);

  return { data, loading: false, error: null };
}
