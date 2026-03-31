import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header.jsx';
import NationalSummary from './components/NationalSummary.jsx';
import ProvinceFilter from './components/ProvinceFilter.jsx';
import PartyFilter from './components/PartyFilter.jsx';
import SortTabs from './components/SortTabs.jsx';
import RidingGrid from './components/RidingGrid.jsx';
import RidingDetailPanel from './components/RidingDetailPanel.jsx';
import MapView from './components/MapView.jsx';
import SupportSection from './components/SupportSection.jsx';
import Footer from './components/Footer.jsx';

const API = import.meta.env.VITE_API_URL || '';

const SORT_KEYS = [
  { key: 'duck',         label: 'Value',       icon: '🦆' },
  { key: 'composite',    label: 'Overall',     icon: '🏆' },
  { key: 'performance',  label: 'MP Work',     icon: '🏛️' },
  { key: 'investment',   label: 'Investment',  icon: '💰' },
  { key: 'electoral',    label: 'Electoral',   icon: '🗳️' },
  { key: 'demographics', label: 'Demographics',icon: '📊' },
  { key: 'expenses',     label: 'Expenses',    icon: '📋' },
  { key: 'transfers',    label: 'Transfers',   icon: '🔄' },
];

const PARTY_COLORS = {
  'Liberal':       '#D71920',
  'Conservative':  '#1A4782',
  'NDP':           '#F58220',
  'Bloc Québécois':'#33B2CC',
  'Green':         '#3D9B35',
  'Green Party':   '#3D9B35',
  'Independent':   '#888888',
};

export default function App() {
  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [sortKey, setSortKey]         = useState('duck');
  const [selectedRiding, setSelectedRiding] = useState(null);
  const [provinceFilter, setProvinceFilter] = useState('ALL');
  const [partyFilter, setPartyFilter] = useState('ALL');
  const [mapView, setMapView]         = useState(false);
  const [search, setSearch]           = useState('');

  // Read URL params on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prov = params.get('province');
    const party = params.get('party');
    if (prov) setProvinceFilter(prov.toUpperCase());
    if (party) setPartyFilter(party);
  }, []);

  // Update URL when filters change
  useEffect(() => {
    const url = new URL(window.location);
    if (provinceFilter === 'ALL') url.searchParams.delete('province');
    else url.searchParams.set('province', provinceFilter.toLowerCase());
    if (partyFilter === 'ALL') url.searchParams.delete('party');
    else url.searchParams.set('party', partyFilter);
    window.history.replaceState({}, '', url);
  }, [provinceFilter, partyFilter]);

  useEffect(() => {
    fetch(`${API}/api/mps`)
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
        if (window.innerWidth >= 900 && d?.ridings?.length) {
          const sorted = [...d.ridings].sort((a, b) => (b.duckScore ?? 0) - (a.duckScore ?? 0));
          setSelectedRiding(sorted[0]);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const ridings = data?.ridings ?? [];
  const national = data?.national ?? {};

  const sortScore = riding => {
    if (sortKey === 'duck')      return riding.duckScore ?? 0;
    if (sortKey === 'composite') return riding.composite ?? 0;
    return riding.categories?.[sortKey]?.score ?? 0;
  };

  const filteredRidings = useMemo(() => {
    let list = [...ridings];
    if (provinceFilter !== 'ALL') {
      list = list.filter(r => r.province === provinceFilter);
    }
    if (partyFilter !== 'ALL') {
      list = list.filter(r => r.mpParty === partyFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.mpName?.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => sortScore(b) - sortScore(a));
  }, [ridings, provinceFilter, partyFilter, search, sortKey]);

  const rankedAll = useMemo(() =>
    [...ridings].sort((a, b) => sortScore(b) - sortScore(a)),
    [ridings, sortKey]
  );

  return (
    <div className="app-shell">
      <Header lastUpdated={data?.lastUpdated} />
      <NationalSummary national={national} ridings={ridings} />
      <main className="app-shell__main">
        {/* Search is priority #1 with 338 ridings */}
        <div className="search-bar">
          <input
            type="search"
            placeholder="Search by riding name or MP name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-bar__input"
            aria-label="Search ridings"
          />
          {search && (
            <span className="search-bar__count">
              {filteredRidings.length} result{filteredRidings.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="filter-row">
          <ProvinceFilter active={provinceFilter} onChange={setProvinceFilter} />
          <PartyFilter active={partyFilter} onChange={setPartyFilter} colors={PARTY_COLORS} />
        </div>
        {/* View switcher — prominent, not hidden in tab row */}
        <div className="view-switcher">
          <button
            className={`view-switcher__btn${!mapView ? ' view-switcher__btn--active' : ''}`}
            onClick={() => setMapView(false)}
          >
            📋 List
          </button>
          <button
            className={`view-switcher__btn${mapView ? ' view-switcher__btn--active' : ''}`}
            onClick={() => setMapView(true)}
          >
            🗺️ Map
          </button>
          <span className="view-switcher__count">{filteredRidings.length} ridings</span>
        </div>
        <SortTabs
          sortKey={sortKey}
          onChange={setSortKey}
          tabs={SORT_KEYS}
        />
        {/* Filter label removed — count is now in view-switcher */}
        {mapView ? (
          <MapView cities={filteredRidings} onSelect={setSelectedRiding} sortKey={sortKey} />
        ) : (
          <div className="app-shell__columns">
            <RidingGrid
              ridings={filteredRidings}
              allRidings={rankedAll}
              selectedRiding={selectedRiding}
              onSelect={setSelectedRiding}
              sortKey={sortKey}
              loading={loading}
              partyColors={PARTY_COLORS}
            />
            {selectedRiding && (
              <RidingDetailPanel
                riding={selectedRiding}
                onClose={() => setSelectedRiding(null)}
                sortKey={sortKey}
                partyColors={PARTY_COLORS}
              />
            )}
          </div>
        )}
      </main>
      <SupportSection />
      <Footer />
    </div>
  );
}
