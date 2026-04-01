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

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    import('leaflet').then(mod => {
      const L = mod.default;
      window.L = L;

      const map = L.map(containerRef.current, {
        center: [54, -97],
        zoom: 4,
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
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
      layerRef.current = null;
      delete window.__ridingSelectFromMap__;
    };
  }, []);

  // Add markers when ridings or sortKey changes
  useEffect(() => {
    if (!ridings.length || !mapRef.current) return;
    // Wait for leaflet to be ready
    const checkMap = () => {
      if (!window.L || !mapRef.current) {
        setTimeout(checkMap, 200);
        return;
      }
      const L = window.L;

      // Remove old layer
      if (layerRef.current) {
        mapRef.current.removeLayer(layerRef.current);
      }

      const group = L.featureGroup();

      ridings.forEach(riding => {
        if (!riding.lat || !riding.lng) return;

        const score = getScore(riding, sortKey);
        const grade = toGrade(score);
        const fill  = gradeFill(grade);

        const icon = L.divIcon({
          className: 'bfyd-marker',
          html: '<div style="' +
            'background:' + fill + ';' +
            'border:2px solid white;' +
            'border-radius:50%;' +
            'width:24px;height:24px;' +
            'display:flex;align-items:center;justify-content:center;' +
            'font-size:9px;font-weight:700;color:white;' +
            'box-shadow:0 2px 6px rgba(0,0,0,0.4);' +
            'font-family:system-ui,sans-serif;' +
            '">' + grade + '</div>',
          iconSize:   [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([riding.lat, riding.lng], { icon })
          .bindPopup(
            '<div style="font-family:system-ui,sans-serif;min-width:160px;">' +
              '<strong style="font-size:13px;">' + riding.name + '</strong>' +
              '<div style="font-size:11px;color:#666;margin-bottom:4px;">' +
                (riding.mpName || 'Vacant') + ' &middot; ' + (riding.mpParty || '') + ' &middot; ' + riding.province +
              '</div>' +
              '<div style="font-size:12px;">' +
                'Performance: <strong style="color:' + gradeFill(riding.grade) + '">' + riding.grade + ' &middot; ' + riding.composite + '/100</strong>' +
              '</div>' +
              (riding.duckScore != null
                ? '<div style="font-size:12px;">Value: <strong style="color:' + gradeFill(toGrade(riding.duckScore)) + '">' + toGrade(riding.duckScore) + ' &middot; ' + riding.duckScore + '/100</strong></div>'
                : '') +
              '<button onclick="window.__ridingSelectFromMap__(\'' + riding.ridingCode + '\')" style="' +
                'margin-top:6px;font-size:11px;padding:4px 10px;' +
                'background:#D52B1E;color:white;border:none;border-radius:4px;cursor:pointer;">' +
                'View details &rarr;' +
              '</button>' +
            '</div>'
          );

        group.addLayer(marker);
      });

      group.addTo(mapRef.current);
      layerRef.current = group;

      // Fit bounds to show all markers
      if (group.getLayers().length > 0) {
        mapRef.current.fitBounds(group.getBounds(), { padding: [40, 40], maxZoom: 6 });
      }

      // Bridge for popup clicks
      window.__ridingSelectFromMap__ = code => {
        const riding = ridings.find(r => r.ridingCode === code);
        if (riding) { onSelect(riding); mapRef.current?.closePopup(); }
      };
    };

    checkMap();
  }, [ridings, sortKey]);

  return (
    <div className="map-view">
      <div ref={containerRef} className="map-view__container" style={{ height: '560px', width: '100%' }} />
      <p className="map-view__legend">
        Markers coloured by <strong>{sortKey === 'duck' ? 'Value' : sortKey}</strong> grade.
        Click a riding to see details.
      </p>
    </div>
  );
}
