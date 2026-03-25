import { useEffect, useRef } from 'react';
import { gradeFill, toGrade, PROVINCE_COLORS } from '../utils/grading.js';

function getScore(city, sortKey) {
  if (sortKey === 'duck')      return city.duckScore ?? city.composite;
  if (sortKey === 'composite') return city.composite;
  return city.categories?.[sortKey]?.score ?? city.composite;
}

export default function MapView({ cities, onSelect, sortKey }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markersRef   = useRef([]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Dynamic import to avoid SSR issues
    let L;
    let mounted = true;

    import('leaflet').then(leaflet => {
      if (!mounted) return;
      L = leaflet.default;

      // Init map centred on Canada
      const map = L.map(containerRef.current, {
        center:    [55, -95],
        zoom:      4,
        minZoom:   3,
        maxZoom:   13,
      });
      mapRef.current = map;

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap · © CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      // Add city markers
      cities.forEach(city => {
        if (!city.lat || !city.lon) return;
        const score  = getScore(city, sortKey);
        const grade  = toGrade(score);
        const color  = PROVINCE_COLORS[city.provinceAbbr] ?? '#555';
        const fill   = gradeFill(grade);

        const icon = L.divIcon({
          className: '',
          html: `
            <div style="
              background: ${fill};
              border: 2px solid white;
              border-radius: 50%;
              width: 28px; height: 28px;
              display: flex; align-items: center; justify-content: center;
              font-size: 10px; font-weight: 700; color: white;
              box-shadow: 0 2px 6px rgba(0,0,0,0.35);
              cursor: pointer;
              font-family: system-ui, sans-serif;
            ">${grade}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([city.lat, city.lon], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family: system-ui, sans-serif; min-width: 140px;">
              <strong style="font-size: 13px;">${city.name}</strong>
              <div style="font-size: 11px; color: #666; margin-bottom: 4px;">${city.province ?? ''}</div>
              <div style="font-size: 12px;">
                Performance: <strong style="color:${gradeFill(city.grade)}">${city.grade} · ${city.composite}/100</strong>
              </div>
              ${city.duckScore != null ? `<div style="font-size:12px;">🦆 Value: <strong style="color:${gradeFill(toGrade(city.duckScore))}">${toGrade(city.duckScore)} · ${city.duckScore}/100</strong></div>` : ''}
              <button onclick="window.__citySelectFromMap__('${city.cmaCode}')" style="
                margin-top: 6px; font-size: 11px; padding: 3px 8px;
                background: #1A1A1A; color: white; border: none; border-radius: 4px; cursor: pointer;
              ">View details →</button>
            </div>
          `);

        markersRef.current.push({ cmaCode: city.cmaCode, marker });
      });

      // Global bridge for popup button clicks
      window.__citySelectFromMap__ = cmaCode => {
        const city = cities.find(c => c.cmaCode === cmaCode);
        if (city) { onSelect(city); map.closePopup(); }
      };
    });

    return () => {
      mounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current = [];
      delete window.__citySelectFromMap__;
    };
  }, []); // init once

  // Update marker colors when sortKey changes (re-render markers)
  useEffect(() => {
    if (!mapRef.current) return;
    import('leaflet').then(leaflet => {
      const L = leaflet.default;
      markersRef.current.forEach(({ cmaCode, marker }) => {
        const city  = cities.find(c => c.cmaCode === cmaCode);
        if (!city)  return;
        const score = getScore(city, sortKey);
        const grade = toGrade(score);
        const fill  = gradeFill(grade);
        marker.setIcon(L.divIcon({
          className: '',
          html: `<div style="
            background:${fill};border:2px solid white;border-radius:50%;
            width:28px;height:28px;display:flex;align-items:center;justify-content:center;
            font-size:10px;font-weight:700;color:white;
            box-shadow:0 2px 6px rgba(0,0,0,0.35);cursor:pointer;
            font-family:system-ui,sans-serif;">${grade}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        }));
      });
    });
  }, [sortKey, cities]);

  return (
    <div className="map-view">
      <div ref={containerRef} className="map-view__container" style={{ height: '520px', width: '100%' }} />
      <p className="map-view__legend">
        Markers coloured by <strong>{sortKey === 'duck' ? '🦆 Value' : sortKey}</strong> grade.
        Click a city to see its popup, then "View details" for the full breakdown.
      </p>
    </div>
  );
}
