import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import geoData from '../data/canada-provinces.json';
import { PROVINCE_COLORS, toGrade } from '../utils/grading.js';

// ── Province name → code ──────────────────────────────────────────────────
const NAME_TO_CODE = {
  'British Columbia':         'BC',
  'Alberta':                  'AB',
  'Saskatchewan':             'SK',
  'Manitoba':                 'MB',
  'Ontario':                  'ON',
  'Quebec':                   'QC',
  'New Brunswick':            'NB',
  'Nova Scotia':              'NS',
  'Prince Edward Island':     'PE',
  'Newfoundland and Labrador':'NL',
};

const SCORED = new Set(Object.values(NAME_TO_CODE));

// ── Grade label positions (lon, lat) ─────────────────────────────────────
const LABEL_COORDS = {
  BC: [-124.5, 54.0],
  AB: [-114.2, 55.0],
  SK: [-106.0, 54.5],
  MB: [-98.5,  55.0],
  ON: [-83.5,  49.5],
  QC: [-71.5,  52.5],
  NB: [-66.6,  46.6],
  NS: [-63.2,  45.1],
  PE: [-63.2,  46.4],
  NL: [-60.5,  53.5],
};

// Atlantic provinces shown in inset
const ATLANTIC = new Set(['NB', 'NS', 'PE', 'NL']);

// ── Colour helpers ────────────────────────────────────────────────────────
function scoreToFill(score) {
  if (score == null) return '#23233a';          // territory — dark navy
  const t = Math.max(0, Math.min(100, score)) / 100;
  const s = Math.round(15 + (1 - t) * 65);     // 15 % (white) → 80 % (red)
  const l = Math.round(35 + t * 60);            // 35 % (red)   → 95 % (white)
  return `hsl(4, ${s}%, ${l}%)`;
}

function labelColor(score) {
  if (score == null) return '#555';
  const t = Math.max(0, Math.min(100, score)) / 100;
  return (35 + t * 60) > 67 ? '#1a1a2e' : '#fff';
}

// ── Main projection — provinces only (42–60°N) ────────────────────────────
// scale:800 fills the 800-wide viewBox across the province longitude span.
// center:[0,51] puts 51°N (mid-province) at the SVG translate point.
// viewBox "0 145 800 290" crops to exactly the province envelope ±~20px.
const MAIN_CFG = {
  projection: 'geoAlbers',
  projectionConfig: {
    rotate:    [96, 0, 0],
    parallels: [42, 60],
    scale:     800,
    center:    [0, 51],
  },
};

// ── Atlantic inset — same projection as main, panned to Atlantic region ───
// Provinces render at x≈216–490, y≈176–411 in shared SVG coords.
// viewBox "200 160 300 255" pans the inset window into that region.
const INSET_CFG = MAIN_CFG; // identical projection, different viewBox only

export default function CanadaMap({ provinces, selectedCode, onSelect }) {
  const byCode = {};
  (provinces || []).forEach(p => { byCode[p.code] = p; });

  return (
    <div className="canada-map-wrap">

      {/* ── Main map ─────────────────────────────────────────────────── */}
      <div className="canada-map-main">
        <ComposableMap
          projection={MAIN_CFG.projection}
          projectionConfig={MAIN_CFG.projectionConfig}
          viewBox="0 145 800 290"
          style={{ width: '100%', height: 'auto' }}
        >
          <Geographies geography={geoData}>
            {({ geographies }) => geographies
              .filter(geo => NAME_TO_CODE[geo.properties.name] != null)
              .map(geo => {
              const name  = geo.properties.name;
              const code  = NAME_TO_CODE[name] ?? null;
              const prov  = code ? byCode[code] : null;
              const score = prov?.composite ?? null;
              const grade = prov?.grade ?? null;
              const isSelected = code === selectedCode;
              const isScored   = SCORED.has(code);

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={() => isScored && onSelect(code)}
                  style={{
                    default: {
                      fill:        scoreToFill(score),
                      stroke:      isSelected ? (PROVINCE_COLORS[code] ?? '#fff') : '#0d0d1a',
                      strokeWidth: isSelected ? 2.5 : 0.4,
                      outline:     'none',
                      cursor:      isScored ? 'pointer' : 'default',
                      transition:  'fill 0.25s ease',
                    },
                    hover: {
                      fill:        isScored ? (scoreToFill(score) === '#23233a' ? '#23233a' : scoreToFill((score ?? 50) - 5)) : '#23233a',
                      stroke:      isScored ? (PROVINCE_COLORS[code] ?? '#aaa') : '#0d0d1a',
                      strokeWidth: isScored ? 1.5 : 0.4,
                      outline:     'none',
                      cursor:      isScored ? 'pointer' : 'default',
                    },
                    pressed: {
                      fill: scoreToFill(score),
                      outline: 'none',
                    },
                  }}
                />
              );
            })}
          </Geographies>

          {/* Grade letter markers — skip Atlantic (shown in inset) */}
          {Object.entries(LABEL_COORDS)
            .filter(([code]) => !ATLANTIC.has(code))
            .map(([code, [lon, lat]]) => {
              const prov = byCode[code];
              if (!prov) return null;
              return (
                <Marker key={code} coordinates={[lon, lat]}>
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={15}
                    fontWeight="800"
                    fill={labelColor(prov.composite)}
                    style={{ pointerEvents: 'none', fontFamily: 'var(--font-serif)' }}
                  >
                    {prov.grade}
                  </text>
                </Marker>
              );
          })}
        </ComposableMap>

        {/* Atlantic provinces badge — displayed over map bottom-right */}
        <div className="canada-map-inset" aria-label="Atlantic provinces detail">
          <div className="canada-map-inset__label">Atlantic</div>
          <ComposableMap
            projection={INSET_CFG.projection}
            projectionConfig={INSET_CFG.projectionConfig}
            viewBox="200 158 300 258"
            style={{ width: '100%', height: 'auto' }}
          >
            <Geographies geography={geoData}>
              {({ geographies }) => geographies
                .filter(geo => NAME_TO_CODE[geo.properties.name] != null)
                .map(geo => {
                const name  = geo.properties.name;
                const code  = NAME_TO_CODE[name] ?? null;
                const prov  = code ? byCode[code] : null;
                const score = prov?.composite ?? null;
                const isSelected = code === selectedCode;

                return (
                  <Geography
                    key={`inset-${geo.rsmKey}`}
                    geography={geo}
                    onClick={() => ATLANTIC.has(code) && onSelect(code)}
                    style={{
                      default: {
                        fill:        ATLANTIC.has(code) ? scoreToFill(score) : 'transparent',
                        stroke:      ATLANTIC.has(code)
                          ? (isSelected ? (PROVINCE_COLORS[code] ?? '#fff') : '#0d0d1a')
                          : 'none',
                        strokeWidth: isSelected ? 2 : 0.4,
                        outline:     'none',
                        cursor:      ATLANTIC.has(code) ? 'pointer' : 'default',
                      },
                      hover: {
                        fill:        ATLANTIC.has(code) ? scoreToFill((score ?? 50) - 5) : 'transparent',
                        stroke:      ATLANTIC.has(code) ? (PROVINCE_COLORS[code] ?? '#aaa') : 'none',
                        strokeWidth: ATLANTIC.has(code) ? 1.5 : 0,
                        outline:     'none',
                        cursor:      ATLANTIC.has(code) ? 'pointer' : 'default',
                      },
                      pressed: { fill: scoreToFill(score), outline: 'none' },
                    }}
                  />
                );
              })}
            </Geographies>

            {/* Atlantic grade labels */}
            {['NB','NS','NL'].map(code => {
              const prov = byCode[code];
              if (!prov) return null;
              const [lon, lat] = LABEL_COORDS[code];
              return (
                <Marker key={`inset-${code}`} coordinates={[lon, lat]}>
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={11}
                    fontWeight="800"
                    fill={labelColor(prov.composite)}
                    style={{ pointerEvents: 'none', fontFamily: 'var(--font-serif)' }}
                  >
                    {prov.grade}
                  </text>
                </Marker>
              );
            })}
            {/* PE is too small — show as a labelled dot */}
            {byCode.PE && (
              <Marker coordinates={[-63.2, 46.2]}>
                <circle r={4} fill={scoreToFill(byCode.PE.composite)} stroke="#0d0d1a" strokeWidth={0.5} />
                <text
                  x={7}
                  dominantBaseline="middle"
                  fontSize={8}
                  fontWeight="800"
                  fill={labelColor(byCode.PE.composite)}
                  style={{ pointerEvents: 'none', fontFamily: 'var(--font-serif)' }}
                >
                  PE {byCode.PE.grade}
                </text>
              </Marker>
            )}
          </ComposableMap>
        </div>
      </div>

      {/* ── Colour legend ────────────────────────────────────────────── */}
      <div className="canada-map-legend">
        <span className="canada-map-legend__label">Better</span>
        <div className="canada-map-legend__bar" />
        <span className="canada-map-legend__label">Worse</span>
      </div>
    </div>
  );
}
