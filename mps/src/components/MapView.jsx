import { useEffect, useRef } from 'react';
import { gradeFill, toGrade } from '../utils/grading.js';

function getScore(riding, sortKey) {
  if (sortKey === 'duck')      return riding.duckScore ?? riding.composite;
  if (sortKey === 'composite') return riding.composite;
  return riding.categories?.[sortKey]?.score ?? riding.composite;
}

export default function MapView({ cities: ridings, onSelect, sortKey }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const layerRef     = useRef(null);
  const ridingsRef   = useRef(ridings);
  const sortKeyRef   = useRef(sortKey);

  // Keep refs current
  ridingsRef.current = ridings;
  sortKeyRef.current = sortKey;

  // Single useEffect: init map + add markers
  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    import('leaflet').then(mod => {
      if (cancelled) return;
      const L = mod.default;

      // Create map if not exists
      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current, {
          center: [54, -97],
          zoom: 4,
          minZoom: 3,
          maxZoom: 13,
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap',
          subdomains: 'abcd',
          maxZoom: 19,
        }).addTo(mapRef.current);
      }

      const map = mapRef.current;

      // Clear old markers
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }

      const data = ridingsRef.current;
      const sk = sortKeyRef.current;
      if (!data.length) return;

      const group = L.featureGroup();
      let count = 0;

      data.forEach(riding => {
        if (!riding.lat || !riding.lng) return;

        const score = getScore(riding, sk);
        const grade = toGrade(score);
        const fill  = gradeFill(grade);

        const icon = L.divIcon({
          className: '',
          html: '<div style="background:' + fill + ';border:2px solid white;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:white;box-shadow:0 2px 6px rgba(0,0,0,0.4);font-family:system-ui,sans-serif;cursor:pointer;">' + grade + '</div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const popup =
          '<div style="font-family:system-ui,sans-serif;min-width:160px;">' +
            '<strong style="font-size:13px;">' + riding.name + '</strong>' +
            '<div style="font-size:11px;color:#666;margin:2px 0 4px;">' + (riding.mpName || 'Vacant') + ' · ' + (riding.mpParty || '') + ' · ' + riding.province + '</div>' +
            '<div style="font-size:12px;">Grade: <strong style="color:' + gradeFill(riding.grade) + '">' + riding.grade + ' · ' + riding.composite + '/100</strong></div>' +
            (riding.duckScore != null ? '<div style="font-size:12px;">Value: <strong style="color:' + gradeFill(toGrade(riding.duckScore)) + '">' + toGrade(riding.duckScore) + ' · ' + riding.duckScore + '/100</strong></div>' : '') +
            '<button onclick="window.__ridingSelect__(\'' + riding.ridingCode + '\')" style="margin-top:6px;font-size:11px;padding:4px 10px;background:#D52B1E;color:white;border:none;border-radius:4px;cursor:pointer;">View details →</button>' +
          '</div>';

        L.marker([riding.lat, riding.lng], { icon }).bindPopup(popup).addTo(group);
        count++;
      });

      group.addTo(map);
      layerRef.current = group;

      // Force map to recalculate size, then fit bounds
      // (container may have 0 height at initial render)
      setTimeout(() => {
        map.invalidateSize();
        if (count > 0) {
          map.fitBounds(group.getBounds(), { padding: [40, 40], maxZoom: 6 });
        }
      }, 200);

      // Popup click bridge
      window.__ridingSelect__ = code => {
        const r = ridingsRef.current.find(r => r.ridingCode === code);
        if (r) { onSelect(r); map.closePopup(); }
      };
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      layerRef.current = null;
      delete window.__ridingSelect__;
    };
  }, [ridings, sortKey]);

  return (
    <div className="map-view">
      <div ref={containerRef} className="map-view__container" style={{ height: '560px', width: '100%' }} />
      <p className="map-view__legend">
        Markers coloured by <strong>{sortKey === 'duck' ? 'Value' : sortKey}</strong> grade. Click a riding for details.
      </p>
    </div>
  );
}
