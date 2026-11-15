import { Slider } from '../Slider';
import { iceColumns } from '../engine';
import type { StageProps } from './common';
import { Btn, Play } from './common';

const layerInfo = [
  { name: 'BASALT ROCK', fill: '#4e4f5c', note: 'Grey echo: solid rock' },
  { name: 'FROZEN SOIL', fill: '#b87035', note: 'Orange echo: ice is close' },
  { name: 'ICE LAYER', fill: '#7fd3ff', note: 'Blue echo: ice! Drill here' }
];

export function ScanStage({ t, send }: StageProps) {
  const v = t.values, m = t.marks, here = v[0], scanned = m.includes(here), layer = iceColumns[here];
  return <Play vis={<>
    <svg viewBox="0 0 600 300" className="stage-svg scan-svg" aria-label="Underground radar survey">
      <defs>
        <linearGradient id="scan-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2a1f3a" /><stop offset="1" stopColor="#c27a52" /></linearGradient>
        <pattern id="ice-shine" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="#7fd3ff" /><path d="M2 20 L10 4 M14 22 L22 8" stroke="#e9f8ff" strokeWidth="2" /></pattern>
        <pattern id="frozen" width="18" height="18" patternUnits="userSpaceOnUse"><rect width="18" height="18" fill="#b87035" /><circle cx="5" cy="5" r="2" fill="#f2e6da" /><circle cx="13" cy="12" r="1.5" fill="#f2e6da" /></pattern>
        <pattern id="basalt" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="#4e4f5c" /><circle cx="6" cy="8" r="2" fill="#3a3b46" /><circle cx="15" cy="15" r="2.5" fill="#5f606e" /></pattern>
        <pattern id="unknown" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#3b2a24" /><path d="M0 14 L14 0" stroke="#4b362e" strokeWidth="3" /></pattern>
      </defs>
      <rect width="600" height="96" fill="url(#scan-sky)" />
      <rect y="96" width="600" height="44" fill="#a0532f" />
      <text x="592" y="134" textAnchor="end" className="layer-label">DUSTY REGOLITH</text>
      {iceColumns.map((l, i) => { const seen = m.includes(i); return <g key={i} onClick={() => send('move', undefined, i)} style={{ cursor: 'pointer' }}>
        <rect x={i * 100} y="140" width="100" height="100" fill={seen ? ['url(#basalt)', 'url(#frozen)', 'url(#ice-shine)'][l] : 'url(#unknown)'} stroke="#1a1210" strokeWidth="2" />
        <text x={i * 100 + 50} y="196" textAnchor="middle" className={seen ? 'layer-label' : 'svg-label'}>{seen ? layerInfo[l].name : '?'}</text>
        <text x={i * 100 + 50} y="290" textAnchor="middle" className="svg-label">{i + 1}</text>
      </g>; })}
      <rect y="240" width="600" height="34" fill="#3a2a2e" /><text x="592" y="262" textAnchor="end" className="layer-label">BEDROCK</text>
      <rect x={here * 100 + 2} y="98" width="96" height="174" fill="none" stroke="#f2d33c" strokeWidth="3" strokeDasharray="8 6" pointerEvents="none" />
      <g transform={`translate(${here * 100 + 50} 70)`} className="rover-move" pointerEvents="none">
        <rect x="-34" y="-6" width="68" height="20" rx="5" fill="#e3e7ee" stroke="#8d99ab" strokeWidth="2" />
        <rect x="-22" y="-16" width="30" height="12" rx="3" fill="#1f4fa8" stroke="#8d99ab" />
        <path d="M18 -6 V-28 h10" stroke="#8d99ab" strokeWidth="4" fill="none" /><circle cx="30" cy="-28" r="4" fill="#f2d33c" />
        {[-24, 0, 24].map(x => <circle key={x} cx={x} cy="18" r="8" fill="#2e323c" stroke="#8d99ab" strokeWidth="2" />)}
        <g key={m.length * 10 + t.mistakes} className="radar-ping">{[0, 1, 2].map(k => <path key={k} d={`M-${20 + k * 14} ${40 + k * 18} Q0 ${58 + k * 22} ${20 + k * 14} ${40 + k * 18}`} stroke={scanned ? layerInfo[layer].fill : '#9fe8ff'} strokeWidth="3" fill="none" style={{ animationDelay: `${k * .15}s` }} />)}</g>
      </g>
    </svg>
</>} controls={<>
    <div className="scan-legend">{layerInfo.map(l => <span key={l.name}><i style={{ background: l.fill }} />{l.note}</span>)}</div>
    <Slider label="Rover position" max={5} value={v[0]} onChange={value => send('move', undefined, value)} />
    <div className="stage-buttons"><Btn onClick={() => send('scan')}>📡 Scan column {v[0] + 1}</Btn><Btn primary disabled={!scanned || layer !== 2} onClick={() => send('dig')}>⛏ Drill and extract ice</Btn></div>
  </>} />;
}

/** Temperature (−20…+10 °C) vs heating energy chart. Theoretical curve plus the player's position. */
function PhaseChart({ energy, temp, melted }: { energy: number; temp: number; melted: number }) {
  const X = (e: number) => 40 + e / 16 * 250, Y = (c: number) => 120 - (c + 20) / 30 * 100;
  return <svg viewBox="0 0 310 150" className="phase-chart" aria-label="Temperature as heat is added">
    <rect x="40" y="20" width="250" height="100" fill="#0b1424" stroke="#33415c" />
    <path d={`M${X(0)} ${Y(-20)} L${X(2)} ${Y(0)} L${X(12)} ${Y(0)} L${X(14)} ${Y(10)}`} stroke="#4a5a78" strokeWidth="3" fill="none" strokeDasharray="5 5" />
    <rect x={X(2)} y={Y(0) - 12} width={X(12) - X(2)} height="24" fill="#7fd3ff22" />
    <text x={(X(2) + X(12)) / 2} y={Y(0) - 16} textAnchor="middle" className="chart-note">MELTING: temperature stays at 0 °C</text>
    <text x="34" y={Y(0) + 4} textAnchor="end" className="chart-axis">0°</text><text x="34" y={Y(-20) + 4} textAnchor="end" className="chart-axis">−20°</text><text x="34" y={Y(10) + 4} textAnchor="end" className="chart-axis">+10°</text>
    <text x="165" y="140" textAnchor="middle" className="chart-axis">HEAT ADDED →</text>
    <circle cx={X(Math.min(16, energy))} cy={Y(Math.max(-20, Math.min(10, temp)))} r="7" fill={melted >= 100 ? '#3d8bff' : '#bfe8ff'} stroke="#fff" strokeWidth="2" />
  </svg>;
}

export function MeltStage({ t, send, setRunning }: StageProps) {
  const v = t.values, [loaded, sealed, pressure, temp, liquid, , energy, heating] = v;
  const needle = -135 + Math.min(120, pressure) / 120 * 270, inBand = pressure >= 50 && pressure <= 90;
  const arc = (from: number, to: number) => { const a = (p: number) => (-135 + p / 120 * 270 - 90) * Math.PI / 180, r = 46; return `M${Math.cos(a(from)) * r} ${Math.sin(a(from)) * r} A${r} ${r} 0 0 1 ${Math.cos(a(to)) * r} ${Math.sin(a(to)) * r}`; };
  const mercury = (Math.max(-20, Math.min(10, temp)) + 20) / 30;
  const heatOn = () => { send('heat', undefined, 1); setRunning(true); }, heatOff = () => send('heat', undefined, 0);
  return <Play vis={<>
    <svg viewBox="0 0 420 300" className="stage-svg" aria-label="Melting tank">
        <defs><linearGradient id="tank-metal" x1="0" x2="1"><stop offset="0" stopColor="#8d99ab" /><stop offset=".5" stopColor="#dfe5ee" /><stop offset="1" stopColor="#8d99ab" /></linearGradient>
          <linearGradient id="water-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6fc3ff" /><stop offset="1" stopColor="#1e6fc2" /></linearGradient></defs>
        <rect width="420" height="300" fill="#0d1828" rx="10" />
        {/* tank */}
        <rect x="40" y="70" width="180" height="190" rx="18" fill="#132238" stroke="url(#tank-metal)" strokeWidth="10" />
        <rect x="55" y={250 - liquid * 1.6} width="150" height={liquid * 1.6} fill="url(#water-g)" opacity=".9" />
        {loaded === 1 && liquid < 100 && <g transform={`translate(130 ${215 - liquid * .9}) scale(${1 - liquid / 130})`}>
          <path d="M-38 -30 L30 -38 L40 28 L-30 36 Z" fill="#d9f4ff" stroke="#9fdcff" strokeWidth="3" /><path d="M-20 -18 L8 -22 M-14 6 L18 2" stroke="#ffffff" strokeWidth="3" />
        </g>}
        {loaded === 1 && !sealed && liquid < 100 && [0, 1, 2].map(i => <path key={i} d={`M${100 + i * 30} 62 q-8 -14 0 -26 q8 -12 0 -24`} stroke="#d9f4ff" strokeWidth="3" fill="none" className="vapor" style={{ animationDelay: `${i * .4}s` }} />)}
        {loaded === 1 && !sealed && liquid < 100 && <text x="130" y="22" textAnchor="middle" className="warn-label">ICE TURNS TO VAPOUR IN THE OPEN!</text>}
        <g transform={`rotate(${sealed ? 0 : -32} 40 66)`}><rect x="30" y="56" width="200" height="16" rx="6" fill="url(#tank-metal)" /><rect x="118" y="46" width="24" height="12" rx="3" fill="#8d99ab" /></g>
        <text x="130" y="288" textAnchor="middle" className="svg-label">{sealed ? '🔒 SEALED' : 'LID OPEN'} · {liquid.toFixed(0)}% LIQUID</text>
        {/* heater */}
        <path d="M60 262 l10 -8 l10 8 l10 -8 l10 8 l10 -8 l10 8 l10 -8 l10 8 l10 -8 l10 8 l10 -8 l10 8 l10 -8 l10 8" stroke={heating ? '#ff6a3a' : '#5a6272'} strokeWidth="5" fill="none" className={heating ? 'heater-on' : ''} />
        {/* pressure dial */}
        <g transform="translate(300 110)">
          <circle r="58" fill="#e9edf3" stroke="#8d99ab" strokeWidth="5" />
          <path d={arc(0, 50)} stroke="#c9d2de" strokeWidth="9" fill="none" /><path d={arc(50, 90)} stroke="#3cc27a" strokeWidth="9" fill="none" /><path d={arc(90, 120)} stroke="#e2573b" strokeWidth="9" fill="none" />
          <line x1="0" y1="0" x2="0" y2="-40" stroke={inBand ? '#1f7a45' : '#b22'} strokeWidth="4" strokeLinecap="round" transform={`rotate(${needle})`} />
          <circle r="6" fill="#333" /><text y="30" textAnchor="middle" fontSize="12" fill="#333" fontWeight="700">{pressure}</text>
          <text y="76" textAnchor="middle" className="svg-label">PRESSURE</text>
        </g>
        {/* thermometer */}
        <g transform="translate(390 40)">
          <rect x="-9" y="0" width="18" height="190" rx="9" fill="#e9edf3" stroke="#8d99ab" strokeWidth="2" />
          <rect x="-5" y={6 + (1 - mercury) * 176} width="10" height={mercury * 176 + 8} rx="5" fill={temp < 0 ? '#3d8bff' : '#e2412f'} />
          <circle cy="204" r="14" fill={temp < 0 ? '#3d8bff' : '#e2412f'} stroke="#8d99ab" strokeWidth="2" />
          <line x1="-14" x2="14" y1={6 + 20 / 30 * 176} y2={6 + 20 / 30 * 176} stroke="#f2d33c" strokeWidth="2" />
          <text x="-16" y={10 + 20 / 30 * 176} textAnchor="end" className="svg-label">0°</text>
          <text y="250" textAnchor="middle" className="temp-big">{temp.toFixed(0)}°C</text>
        </g>
      </svg>
</>} controls={<>
      <div className="melt-side">
        <ol className="step-track">
          {[['Load ice', loaded === 1], ['Close lid', !!sealed], ['Pressure in green', inBand], ['Heat until 100% liquid', liquid >= 100], ['Stop heating', t.done]].map(([label, ok], i) => <li key={i} className={ok ? 'ok' : ''}><b>{ok ? '✓' : i + 1}</b>{label as string}</li>)}
        </ol>
        <PhaseChart energy={energy} temp={temp} melted={liquid} />
        <p className="stage-caption">{temp === 0 && liquid < 100 && heating ? 'Look: the heat is melting the ice, so the temperature stays at 0 °C.' : liquid >= 100 ? 'All melted. Release HEAT now to save energy!' : `${energy.toFixed(1)} energy units used`}</p>
      </div>
    <div className="stage-buttons"><Btn disabled={!!loaded} onClick={() => send('load')}>🧊 Load ice</Btn><Btn onClick={() => send('lid')}>{sealed ? '🔓 Open lid' : '🔒 Close lid'}</Btn><Btn disabled={!sealed || pressure >= 80} onClick={() => send('pump')}>🎈 Pump +20</Btn></div>
    <button type="button" className={`heat-button ${heating ? 'heating' : ''}`} aria-pressed={!!heating}
      onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); heatOn(); }} onPointerUp={heatOff} onPointerCancel={heatOff} onLostPointerCapture={() => { if (heating) heatOff(); }}
      onKeyDown={e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); heatOn(); } }} onKeyUp={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); heatOff(); } }}>🔥 Hold to heat · release to stop</button>
  </>} />;
}

const filters = [
  { name: 'Coarse grille', catches: 'Rocks & grit', icon: '🪨' },
  { name: 'Fine filter', catches: 'Dust & silt', icon: '🌫️' },
  { name: 'Salt membrane', catches: 'Dissolved salts & perchlorate', icon: '🧂' }
];

function FilterLayer({ kind, y }: { kind: number; y: number }) {
  return <g transform={`translate(30 ${y})`}>
    <rect width="200" height="56" rx="6" fill={['#3a4458', '#d8cfb8', '#2f5f7a'][kind]} />
    {kind === 0 && Array.from({ length: 9 }, (_, i) => <rect key={i} x={10 + i * 21} y="4" width="8" height="48" rx="2" fill="#8d99ab" />)}
    {kind === 1 && Array.from({ length: 24 }, (_, i) => <path key={i} d={`M${(i * 17) % 200} 0 L${(i * 29 + 40) % 200} 56`} stroke="#a89878" strokeWidth="1.5" />)}
    {kind === 2 && <>{[12, 28, 44].map(yy => <path key={yy} d={`M0 ${yy} q12 -8 25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0`} stroke="#9fdcff" strokeWidth="2.5" fill="none" />)}</>}
  </g>;
}

export function FilterStage({ t, send }: StageProps) {
  const m = t.marks, ran = t.phase === 1;
  return <Play vis={<>
    <svg viewBox="0 0 260 440" className="stage-svg filter-svg" aria-label="Filter column">
        <defs><linearGradient id="dirty" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9a6a42" /><stop offset="1" stopColor="#6e4a2e" /></linearGradient></defs>
        <rect width="260" height="440" fill="#0d1828" rx="10" />
        <rect x="30" y="14" width="200" height="74" rx="8" fill={ran ? '#2d4a66' : 'url(#dirty)'} stroke="#8d99ab" strokeWidth="3" />
        {!ran && <>{[[60, 40, 10], [150, 60, 8], [200, 34, 7]].map(([x, y, r]) => <path key={x} d={`M${x - r} ${y} l${r} ${-r} l${r} ${r * .6} l${-r * .4} ${r} Z`} fill="#4a3a30" />)}
          {Array.from({ length: 18 }, (_, i) => <circle key={i} cx={45 + (i * 37) % 170} cy={26 + (i * 13) % 52} r="2" fill="#c8a07a" />)}
          {Array.from({ length: 6 }, (_, i) => <g key={i} transform={`translate(${55 + i * 30} ${34 + (i % 2) * 30})`}><circle r="7" fill="#b06cff" /><text y="4" textAnchor="middle" fontSize="10" fill="#fff">{i % 2 ? '−' : '+'}</text></g>)}</>}
        <text x="130" y="104" textAnchor="middle" className="svg-label">{ran ? 'WATER FLOWING ↓' : 'MELTED WATER: GRIT + DUST + SALTS'}</text>
        {[0, 1, 2].map(i => m[i] !== undefined ? <FilterLayer key={i} kind={m[i]} y={114 + i * 72} /> : <g key={i}><rect x="30" y={114 + i * 72} width="200" height="56" rx="6" fill="none" stroke="#56647e" strokeWidth="2" strokeDasharray="7 6" /><text x="130" y={148 + i * 72} textAnchor="middle" className="svg-label">SLOT {i + 1} · {['TOP', 'MIDDLE', 'BOTTOM'][i]}</text></g>)}
        {ran && <>
          {[[60, 116], [140, 114], [196, 118]].map(([x, y]) => <path key={x} d={`M${x - 8} ${y + 6} l8 -8 l8 5 l-3 8 Z`} fill="#4a3a30" />)}
          {Array.from({ length: 14 }, (_, i) => <circle key={i} cx={40 + (i * 37) % 180} cy={190} r="2.5" fill="#8a6a4a" />)}
          {Array.from({ length: 6 }, (_, i) => <circle key={i} cx={50 + i * 32} cy={262} r="6" fill="#b06cff" />)}
          {[0, 1, 2, 3].map(i => <circle key={i} cx={90 + i * 26} cy="340" r="4" fill="#7fd3ff" className="drip" style={{ animationDelay: `${i * .3}s` }} />)}
        </>}
        <path d="M70 360 h120 l-12 66 h-96 Z" fill="#132238" stroke="#8d99ab" strokeWidth="3" />
        {ran && <path d="M76 384 h108 l-8 38 h-92 Z" fill="#6fc3ff" opacity=".9" />}
        <text x="130" y="436" textAnchor="middle" className="svg-label">SAMPLE CUP</text>
      </svg>
</>} controls={<>
      <div className="filter-side">
        <strong className="side-title">FILTER STAGES · click to add to the next slot</strong>
        {filters.map((f, i) => <button type="button" key={f.name} className="filter-card" disabled={m.includes(i)} onClick={() => send('choose', i)}>
          <svg viewBox="0 0 260 64" aria-hidden="true"><FilterLayer kind={i} y={4} /></svg>
          <span><b>{f.name}</b><small>Stops: {f.catches}</small><em>Holes: {['large', 'small', 'tiny, almost molecular'][i]}</em></span>
        </button>)}
        <div className={`conductivity ${ran ? 'ok' : ''}`}><span>⚡ CONDUCTIVITY SENSOR</span><div className="meter-track"><span style={{ width: ran ? '12%' : '92%', background: ran ? '#3cc27a' : '#e2573b' }} /></div><small>{ran ? 'Low: few dissolved salts left' : 'Salty water conducts electricity well'}</small></div>
      </div>
    <div className="stage-buttons"><Btn onClick={() => send('clear')}>↺ Empty the column</Btn><Btn primary onClick={() => send('run')}>💧 Run water</Btn><Btn disabled={!ran} onClick={() => send('test')}>🔬 Conductivity test</Btn></div>
  </>} />;
}
