/**
 * Lightweight event tracker — fires to our own backend, no third parties.
 * Fire-and-forget: errors are silently swallowed so tracking never breaks the UI.
 *
 * Usage:
 *   track('province_expanded', { province: 'ON' })
 *   track('tab_viewed',        { province: 'QC', detail: 'housing' })
 *   track('sort_changed',      { detail: 'fiscal' })
 *   track('methodology_opened')
 */

const API = import.meta.env.VITE_API_URL ?? '';

export function track(event, { province = null, detail = null } = {}) {
  try {
    fetch(`${API}/api/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        province,
        detail,
        referrer: document.referrer || null,
        // Coarse device hint only — no fingerprinting
        device: window.innerWidth < 768 ? 'mobile' : 'desktop',
      }),
      // keepalive so the request survives page navigation
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Never throw — tracking must be invisible to users
  }
}
