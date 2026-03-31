// Event tracking — mirrors provinces/src/utils/track.js
// Fire-and-forget. Never throws. Never blocks UI.

const API = import.meta.env.VITE_API_URL || '';

export function track(event, { city = null, detail = null } = {}) {
  try {
    fetch(`${API}/api/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        province: city,   // reuse province field for city CMA code
        detail,
        referrer: typeof document !== 'undefined' ? document.referrer || null : null,
        device:   typeof window !== 'undefined'
          ? (window.innerWidth < 768 ? 'mobile' : 'desktop')
          : null,
      }),
    }).catch(() => {});
  } catch {}
}
