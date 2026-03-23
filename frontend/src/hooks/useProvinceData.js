import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const SESSION_KEY = 'psc_data_v1';

export function useProvinceData() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    // Try sessionStorage first (avoids refetch on in-tab navigation)
    const cached = sessionStorage.getItem(SESSION_KEY);
    if (cached) {
      try {
        setData(JSON.parse(cached));
        setLoading(false);
        return;
      } catch { /* fall through to fetch */ }
    }

    fetch(`${API_URL}/api/data`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(json => {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(json));
        setData(json);
      })
      .catch(err => {
        console.error('Failed to fetch province data:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
