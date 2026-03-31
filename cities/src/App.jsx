import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header.jsx';
import NationalSummary from './components/NationalSummary.jsx';
import ProvinceFilter from './components/ProvinceFilter.jsx';
import SortTabs from './components/SortTabs.jsx';
import CityGrid from './components/CityGrid.jsx';
import CityDetailPanel from './components/CityDetailPanel.jsx';
import MapView from './components/MapView.jsx';
import DataSources from './components/DataSources.jsx';
import Footer from './components/Footer.jsx';
import MethodologyModal from './components/MethodologyModal.jsx';
import fallback from './data/fallback.json';

const API = import.meta.env.VITE_API_URL || '';

const SORT_KEYS = [
  { key: 'duck',           label: 'Value',          icon: '🦆' },
  { key: 'composite',      label: 'Overall',        icon: '🏆' },
  { key: 'housing',        label: 'Housing',        icon: '🏠' },
  { key: 'safety',         label: 'Safety',         icon: '🛡️' },
  { key: 'fiscal',         label: 'Fiscal',         icon: '💰' },
  { key: 'liveability',    label: 'Liveability',    icon: '🌳' },
  { key: 'economic',       label: 'Economic',       icon: '📈' },
  { key: 'community',      label: 'Community',      icon: '🤝' },
  { key: 'infrastructure', label: 'Infrastructure', icon: '🏗️' },
];

export default function App() {
  const [data, setData]               = useState(fallback);
  const [loading, setLoading]         = useState(true);
  const [sortKey, setSortKey]         = useState('duck');
  const [selectedCity, setSelectedCity] = useState(null);
  const [provinceFilter, setProvinceFilter] = useState('ALL');
  const [mapView, setMapView]         = useState(false);
  const [search, setSearch]           = useState('');
  const [showMethodology, setShowMethodology] = useState(false);

  // Read ?province= from URL on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prov = params.get('province');
    if (prov) setProvinceFilter(prov.toUpperCase());
  }, []);

  // Update URL when province filter changes
  useEffect(() => {
    const url = new URL(window.location);
    if (provinceFilter === 'ALL') {
      url.searchParams.delete('province');
    } else {
      url.searchParams.set('province', provinceFilter.toLowerCase());
    }
    window.history.replaceState({}, '', url);
  }, [provinceFilter]);

  useEffect(() => {
    fetch(`${API}/api/cities`)
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
        // Auto-select top city on desktop so panel is immediately visible
        if (window.innerWidth >= 900 && d?.cities?.length) {
          const sorted = [...d.cities].sort((a, b) => (b.duckScore ?? 0) - (a.duckScore ?? 0));
          setSelectedCity(sorted[0]);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const cities = data?.cities ?? [];
  const national = data?.national ?? {};

  const sortScore = city => {
    if (sortKey === 'duck')      return city.duckScore ?? 0;
    if (sortKey === 'composite') return city.composite ?? 0;
    return city.categories?.[sortKey]?.score ?? 0;
  };

  const filteredCities = useMemo(() => {
    let list = [...cities];
    if (provinceFilter !== 'ALL') {
      list = list.filter(c => c.provinceAbbr === provinceFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.mayorName?.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => sortScore(b) - sortScore(a));
  }, [cities, provinceFilter, search, sortKey]);

  const rankedAll = useMemo(() =>
    [...cities].sort((a, b) => sortScore(b) - sortScore(a)),
    [cities, sortKey]
  );

  return (
    <div className="app-shell">
      <Header lastUpdated={data?.lastUpdated} />
      <NationalSummary national={national} cities={cities} provinceFilter={provinceFilter} filteredCities={filteredCities} />
      <main className="app-shell__main">
        <div className="search-bar">
          <input
            type="search"
            placeholder="Search by city or mayor name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-bar__input"
            aria-label="Search cities"
          />
        </div>
        <ProvinceFilter active={provinceFilter} onChange={setProvinceFilter} />
        <div className="view-switcher">
          <button className={`view-switcher__btn${!mapView ? ' view-switcher__btn--active' : ''}`} onClick={() => setMapView(false)}>List</button>
          <button className={`view-switcher__btn${mapView ? ' view-switcher__btn--active' : ''}`} onClick={() => setMapView(true)}>Map</button>
          <span className="view-switcher__count">{filteredCities.length} cities</span>
        </div>
        <SortTabs
          sortKey={sortKey}
          onChange={setSortKey}
          tabs={SORT_KEYS}
        />
        {mapView ? (
          <MapView cities={filteredCities} onSelect={setSelectedCity} sortKey={sortKey} />
        ) : (
          <div className="app-shell__columns">
            <CityGrid
              cities={filteredCities}
              allCities={rankedAll}
              selectedCity={selectedCity}
              onSelect={setSelectedCity}
              sortKey={sortKey}
              loading={loading}
            />
            {selectedCity && (
              <CityDetailPanel
                city={selectedCity}
                onClose={() => setSelectedCity(null)}
                sortKey={sortKey}
              />
            )}
          </div>
        )}
      </main>
      <DataSources />
      <Footer onMethodology={() => setShowMethodology(true)} />
      {showMethodology && (
        <MethodologyModal onClose={() => setShowMethodology(false)} />
      )}
    </div>
  );
}
