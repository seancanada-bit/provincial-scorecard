import { useState, useMemo, useRef, useEffect } from 'react';
import { useProvinceData }     from './hooks/useProvinceData.js';
import Header                  from './components/Header.jsx';
import NationalSummary         from './components/NationalSummary.jsx';
import SortTabs                from './components/SortTabs.jsx';
import ProvinceGrid            from './components/ProvinceGrid.jsx';
import ProvinceCard            from './components/ProvinceCard.jsx';
import ProvinceDetailPanel     from './components/ProvinceDetailPanel.jsx';
import SupportSection          from './components/SupportSection.jsx';
import DataSources             from './components/DataSources.jsx';
import Footer                  from './components/Footer.jsx';
import MethodologyModal        from './components/MethodologyModal.jsx';

function getCategoryScore(province, category) {
  if (category === 'overall') return province.composite;
  if (category === 'value')   return province.valueScore ?? 0;
  return province.categories[category]?.score ?? 0;
}

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return mobile;
}

export default function App() {
  const { data } = useProvinceData();
  const [sortKey, setSortKey]           = useState('overall');
  const [selectedCode, setSelectedCode] = useState(null);
  const [showMethodology, setShowMethodology] = useState(false);
  const isMobile = useIsMobile();

  // Count-up fires once on first data load
  const hasAnimated = useRef(false);
  const [animateCount, setAnimateCount] = useState(false);
  useEffect(() => {
    if (data && !hasAnimated.current) {
      hasAnimated.current = true;
      setAnimateCount(true);
      setTimeout(() => setAnimateCount(false), 800);
    }
  }, [data]);

  const sortedProvinces = useMemo(() => {
    if (!data?.provinces) return [];
    return [...data.provinces].sort(
      (a, b) => getCategoryScore(b, sortKey) - getCategoryScore(a, sortKey)
    );
  }, [data, sortKey]);

  // Auto-select top province on desktop
  useEffect(() => {
    if (!isMobile && sortedProvinces.length && !selectedCode) {
      setSelectedCode(sortedProvinces[0].code);
    }
  }, [isMobile, sortedProvinces.length]);

  // On sort change, select new top province on desktop
  function handleTabChange(key) {
    setSortKey(key);
    if (!isMobile && sortedProvinces.length) {
      const newTop = [...(data?.provinces ?? [])].sort(
        (a, b) => getCategoryScore(b, key) - getCategoryScore(a, key)
      )[0];
      if (newTop) setSelectedCode(newTop.code);
    }
  }

  function handleSelect(code) {
    if (isMobile) {
      setSelectedCode(prev => prev === code ? null : code);
    } else {
      setSelectedCode(code);
    }
  }

  const selectedProvince = sortedProvinces.find(p => p.code === selectedCode);

  if (!data) return null;

  return (
    <>
      <Header lastUpdated={data.lastUpdated} />
      <NationalSummary national={data.national} provinces={data.provinces} />

      <main>
        <div className="app-shell">

          {/* ── Province overview grid ── */}
          <div className="app-shell__grid-wrap">
            <ProvinceGrid
              provinces={sortedProvinces}
              selectedCode={selectedCode}
              onSelect={handleSelect}
            />
          </div>

          {/* ── Sort tabs ── */}
          <SortTabs active={sortKey} onChange={handleTabChange} />

          {/* ── Two-column layout ── */}
          <div className="app-shell__columns">

            {/* Left: ranked list */}
            <div className="app-shell__list-col">
              <ol className="province-list" aria-label="Provinces ranked by selected category" style={{ listStyle: 'none' }}>
                {sortedProvinces.map((province, idx) => (
                  <li key={province.code}>
                    <ProvinceCard
                      province={province}
                      rank={idx + 1}
                      selected={selectedCode === province.code}
                      expanded={isMobile && selectedCode === province.code}
                      onSelect={handleSelect}
                      sortKey={sortKey}
                      animateCount={animateCount}
                      onMethodology={() => setShowMethodology(true)}
                      isMobile={isMobile}
                    />
                  </li>
                ))}
              </ol>

              <SupportSection supporters={data.supporters ?? []} />
              <DataSources />
            </div>

            {/* Right: detail panel (desktop only) */}
            {!isMobile && (
              <div className="app-shell__detail-col" aria-label="Province detail">
                {selectedProvince ? (
                  <ProvinceDetailPanel
                    key={selectedProvince.code}
                    province={selectedProvince}
                    onMethodology={() => setShowMethodology(true)}
                  />
                ) : (
                  <div className="dp-empty">
                    <span className="dp-empty__flag">🇨🇦</span>
                    <p>Select a province to see its full breakdown</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <div className="app-footer-wrap">
        <Footer onMethodology={() => setShowMethodology(true)} />
      </div>

      {showMethodology && (
        <MethodologyModal onClose={() => setShowMethodology(false)} />
      )}
    </>
  );
}
