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
  const markersRef   = useRef({ cluster: null, items: [] });

  // ── Init map once ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    let mounted = true;

    import('leaflet').then(leaflet => {
      if (!mounted || mapRef.current) return;
      const L = leaflet.default;

      const map = L.map(containerRef.current, {
        center:  [56, -96],
        zoom:    4,
        minZoom: 3,
        maxZoom: 13,
      });
      mapRef.current = map;

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &middot; CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);
    });

    return () => {
      mounted = false;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
      markersRef.current = { cluster: null, items: [] };
      delete window.__ridingSelectFromMap__;
    };
  }, []);

  // ── Create markers when ridings or sortKey changes ─────────────────────
  useEffect(() => {
    if (!ridings.length) return;

    import('leaflet').then(leafletModule => {
      const L = leafletModule.default;
      window.L = L; // markercluster expects L on window
      return import('leaflet.markercluster').then(() => L);
    }).then(L => {
      if (!mapRef.current) return;

      // Clear old
      if (markersRef.current.cluster) {
        mapRef.current.removeLayer(markersRef.current.cluster);
      }
      markersRef.current = { cluster: null, items: [] };

      const cluster = L.markerClusterGroup({
        maxClusterRadius: 60,  // more aggressive clustering for 340 points
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        disableClusteringAtZoom: 8,
        iconCreateFunction: (c) => {
          const count = c.getChildCount();
          const size = count > 50 ? 48 : count > 20 ? 40 : 34;
          return L.divIcon({
            className: '',
            html: `<div style="
              background:#D52B1E;border:3px solid white;border-radius:50%;
              width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;
              font-size:${size > 40 ? 13 : 11}px;font-weight:700;color:white;
              box-shadow:0 3px 10px rgba(0,0,0,0.4);font-family:system-ui,sans-serif;">${count}</div>`,
            iconSize:   [size, size],
            iconAnchor: [size/2, size/2],
          });
        },
      });

      ridings.forEach(riding => {
        if (!riding.lat || !riding.lng) return;

        const score = getScore(riding, sortKey);
        const grade = toGrade(score);
        const fill  = gradeFill(grade);

        const icon = L.divIcon({
          className: '',
          html: `<div style="
            background:${fill};border:2px solid white;border-radius:50%;
            width:30px;height:30px;display:flex;align-items:center;justify-content:center;
            font-size:10px;font-weight:700;color:white;
            box-shadow:0 2px 8px rgba(0,0,0,0.35);cursor:pointer;
            font-family:system-ui,sans-serif;">${grade}</div>`,
          iconSize:   [30, 30],
          iconAnchor: [15, 15],
        });

        const mpParty = riding.mpParty || '';
        const marker = L.marker([riding.lat, riding.lng], { icon })
          .bindPopup(`
            <div style="font-family:system-ui,sans-serif;min-width:160px;">
              <strong style="font-size:13px;">${riding.name}</strong>
              <div style="font-size:11px;color:#666;margin-bottom:4px;">${riding.mpName || 'Vacant'} · ${mpParty} · ${riding.province}</div>
              <div style="font-size:12px;">
                Performance: <strong style="color:${gradeFill(riding.grade)}">${riding.grade} · ${riding.composite}/100</strong>
              </div>
              ${riding.duckScore != null
                ? `<div style="font-size:12px;">🦆 Value: <strong style="color:${gradeFill(toGrade(riding.duckScore))}">${toGrade(riding.duckScore)} · ${riding.duckScore}/100</strong></div>`
                : ''}
              <button onclick="window.__ridingSelectFromMap__('${riding.ridingCode}')" style="
                margin-top:6px;font-size:11px;padding:4px 10px;
                background:#D52B1E;color:white;border:none;border-radius:4px;cursor:pointer;">
                View details →
              </button>
            </div>
          `);

        cluster.addLayer(marker);
        markersRef.current.items.push({ code: riding.ridingCode, marker });
      });

      mapRef.current.addLayer(cluster);
      markersRef.current.cluster = cluster;

      // Fit map to show all markers
      const bounds = cluster.getBounds();
      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 5 });
      }

      // Bridge for popup clicks
      window.__ridingSelectFromMap__ = code => {
        const riding = ridings.find(r => r.ridingCode === code);
        if (riding) { onSelect(riding); mapRef.current?.closePopup(); }
      };
    });
  }, [ridings, sortKey]);

  return (
    <div className="map-view">
      <div ref={containerRef} className="map-view__container" style={{ height: '560px', width: '100%' }} />
      <p className="map-view__legend">
        Markers coloured by <strong>{sortKey === 'duck' ? '🦆 Value' : sortKey}</strong> grade.
        Click a riding to see its popup, then "View details" for the full breakdown.
      </p>
    </div>
  );
}
