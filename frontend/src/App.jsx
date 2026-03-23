import { useState, useMemo, useRef, useEffect } from 'react';
import { useProvinceData } from './hooks/useProvinceData.js';
import Header           from './components/Header.jsx';
import NationalSummary  from './components/NationalSummary.jsx';
import SortTabs         from './components/SortTabs.jsx';
import ProvinceCard     from './components/ProvinceCard.jsx';
import ProvinceDetail   from './components/ProvinceDetail.jsx';
import SupportSection   from './components/SupportSection.jsx';
import DataSources      from './components/DataSources.jsx';
import Footer           from './components/Footer.jsx';
import MethodologyModal from './components/MethodologyModal.jsx';
import { PROVINCE_COLORS, gradeColorClass } from './utils/grading.js';

function getCategoryScore(province, category) {
  if (category === 'overall') return province.composite;
  return province.categories[category]?.score ?? 0;
}

export default function App() {
  const { data, loading, error } = useProvinceData();
  const [sortKey, setSortKey]         = useState('overall');
  const [expandedCode, setExpandedCode] = useState(null);
  const [showMethodology, setShowMethodology] = useState(false);

  // Count-up only fires once per session
  const hasAnimated = useRef(false);
  const [animateCount, setAnimateCount] = useState(false);

  useEffect(() => {
    if (data && !hasAnimated.current) {
      hasAnimated.current = true;
      setAnimateCount(true);
      // Reset after first render so subsequent sort re-renders don't retrigger
      setTimeout(() => setAnimateCount(false), 800);
    }
  }, [data]);

  const sortedProvinces = useMemo(() => {
    if (!data?.provinces) return [];
    return [...data.provinces].sort(
      (a, b) => getCategoryScore(b, sortKey) - getCategoryScore(a, sortKey)
    );
  }, [data, sortKey]);

  function handleTabChange(key) {
    setSortKey(key);
    // Collapse expanded card on re-sort so the list re-orders cleanly
    setExpandedCode(null);
  }

  function handleToggle(code) {
    setExpandedCode(prev => (prev === code ? null : code));
  }

  if (loading) {
    return (
      <>
        <Header />
        <main>
          <div className="loading-screen" role="status" aria-live="polite">
            <div className="loading-screen__spinner" aria-hidden="true" />
            <p className="loading-screen__text">Loading province data…</p>
          </div>
        </main>
      </>
    );
  }

  if (error && !data) {
    return (
      <>
        <Header />
        <main>
          <div className="error-screen" role="alert">
            <h1 className="error-screen__title">Data unavailable</h1>
            <p className="error-screen__msg">
              Could not load province data. Please try refreshing the page.
              <br />
              <small style={{ color: 'var(--text-muted)' }}>{error}</small>
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header lastUpdated={data?.lastUpdated} />
      <NationalSummary national={data?.national} provinces={data?.provinces} />
      <SortTabs active={sortKey} onChange={handleTabChange} />

      <main>
        <div className="app-layout">
          {/* ── Left column: province list ── */}
          <div className="app-layout__left">
            <ol className="province-list" aria-label="Provinces ranked by selected category" style={{ listStyle: 'none' }}>
              {sortedProvinces.map((province, idx) => (
                <li key={province.code} style={{ transition: 'all 0.15s ease' }}>
                  <ProvinceCard
                    province={province}
                    rank={idx + 1}
                    expanded={expandedCode === province.code}
                    onToggle={() => handleToggle(province.code)}
                    sortKey={sortKey}
                    animateCount={animateCount}
                    onMethodology={() => setShowMethodology(true)}
                  />
                </li>
              ))}
            </ol>

            <SupportSection supporters={data?.supporters ?? []} />
            <DataSources />
          </div>

          {/* ── Right column: desktop detail panel + ad placeholder ── */}
          <aside className="app-layout__right" aria-label="Province detail panel">
            {expandedCode ? (
              <div style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)', border: '1px solid var(--border)', padding: '0' }}>
                {(() => {
                  const prov = sortedProvinces.find(p => p.code === expandedCode);
                  if (!prov) return null;
                  const color = PROVINCE_COLORS[prov.code] ?? '#333';
                  return (
                    <div>
                      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 6, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 800, fontFamily: 'var(--font-serif)' }}>{prov.code}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 15 }}>{prov.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{prov.premierName}</div>
                        </div>
                        <div style={{ marginLeft: 'auto', fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 800, color: 'var(--grade-a)' }}>
                          {prov.grade}
                        </div>
                      </div>
                      <ProvinceDetail province={prov} onMethodology={() => setShowMethodology(true)} />
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, background: 'var(--card-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🇨🇦</div>
                <p>Select a province to see its full breakdown here.</p>
              </div>
            )}

            {/* EthicalAds placeholder */}
            {/* To activate: add EthicalAds script to index.html and set data-ea-publisher */}
            <div id="ethical-ad-unit" className="ad-placeholder" aria-hidden="true" />
          </aside>
        </div>
      </main>

      <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '0 16px' }}>
        <Footer onMethodology={() => setShowMethodology(true)} />
      </div>

      {showMethodology && (
        <MethodologyModal onClose={() => setShowMethodology(false)} />
      )}
    </>
  );
}
