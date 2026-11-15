import type { TrainingRoom } from './catalog';

/** Shared illustrated SVG pieces for the training rooms. All art is original vector drawing. */

export type PlantHealth = 'good' | 'dry' | 'wet' | 'dark';

/** A crop drawn at the origin, growing upwards (negative y). kind: 0 lettuce, 1 mizuna, 2 dwarf tomato. */
export function Plant({ kind, scale = 1, health = 'good', x = 0, y = 0 }: { kind: number; scale?: number; health?: PlantHealth; x?: number; y?: number }) {
  const leaf = health === 'dry' ? '#a48a45' : health === 'wet' ? '#55704f' : health === 'dark' ? '#3e5a3a' : '#5fb24a';
  const leaf2 = health === 'dry' ? '#8a6e35' : health === 'wet' ? '#41593d' : health === 'dark' ? '#2f472c' : '#3f8f35';
  const droop = health === 'good' ? 0 : health === 'dark' ? 6 : 14;
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    {kind === 0 && <>
      {[-50, -25, 0, 25, 50].map((a, i) => <ellipse key={a} cx={0} cy={-26} rx={11} ry={27} transform={`rotate(${a + (a < 0 ? -droop : a > 0 ? droop : 0)} 0 0)`} fill={health === 'good' ? (i % 2 ? '#b23a55' : '#8f2a46') : leaf2} stroke={health === 'good' ? '#e07a8e' : leaf} strokeWidth={1.5} />)}
      <ellipse cx={0} cy={-16} rx={9} ry={18} fill={health === 'good' ? '#7fbf4e' : leaf} />
    </>}
    {kind === 1 && <>
      {[-55, -32, -10, 12, 34, 56].map(a => <g key={a} transform={`rotate(${a + (a < 0 ? -droop : droop)} 0 0)`}>
        <path d="M0 0 C-2 -18 2 -34 0 -50" stroke={leaf2} strokeWidth={2.5} fill="none" />
        {[-14, -24, -34, -44].map(yy => <path key={yy} d={`M0 ${yy} q-9 -3 -11 -10 q7 0 11 6 q4 -6 11 -6 q-2 7 -11 10`} fill={leaf} />)}
      </g>)}
    </>}
    {kind === 2 && <>
      <path d={`M0 0 C2 -20 -3 -40 ${droop / 2} -62`} stroke="#4f7d32" strokeWidth={4} fill="none" />
      {[[-1, -18], [1, -32], [-1, -46], [1, -58]].map(([s, yy]) => <path key={yy} d={`M0 ${yy} q${s * 14} -8 ${s * 24} ${-2 + droop / 2} q${-s * 8} 8 ${-s * 24} 2`} fill={leaf} stroke={leaf2} />)}
      {health !== 'dry' && <>
        <circle cx={-10} cy={-26} r={6.5} fill={health === 'good' ? '#e2412f' : '#a35a3a'} />
        <circle cx={11} cy={-40} r={6} fill={health === 'good' ? '#f05a3a' : '#9c6540'} />
        <circle cx={-8} cy={-52} r={5} fill={health === 'good' ? '#f2a43a' : '#8d7040'} />
      </>}
    </>}
  </g>;
}

export const plantInfo = [
  { name: 'Outredgeous lettuce', short: 'Red lettuce', days: 30, tag: 'Fast leafy crop', color: '#b23a55' },
  { name: 'Mizuna mustard', short: 'Mizuna', days: 35, tag: 'Leafy, peppery', color: '#5fb24a' },
  { name: 'Dwarf tomato', short: 'Tomato', days: 100, tag: 'Slow research crop', color: '#e2412f' }
];

/** Medical tool icons in a 100×100 box. */
export function ToolIcon({ kind }: { kind: number }) {
  return <svg viewBox="0 0 100 100" className="tool-icon" aria-hidden="true">
    {kind === 0 && <g transform="rotate(-30 50 50)"><rect x="10" y="35" width="80" height="30" rx="15" fill="#e8c39e" stroke="#b88a63" strokeWidth="2" /><rect x="36" y="37" width="28" height="26" rx="4" fill="#f6e6d4" />{[0, 1, 2].map(i => [0, 1].map(j => <circle key={`${i}${j}`} cx={20 + i * 5 + (i > 1 ? 50 : 0)} cy={45 + j * 10} r="1.6" fill="#b88a63" />))}</g>}
    {kind === 1 && <g><rect x="28" y="30" width="44" height="58" rx="8" fill="#e8a33c" opacity=".9" /><rect x="24" y="16" width="52" height="16" rx="4" fill="#f4f4f4" stroke="#bbb" /><rect x="32" y="46" width="36" height="24" rx="3" fill="#fff" /><path d="M42 58 h16 M50 50 v16" stroke="#d33" strokeWidth="4" /><g transform="rotate(35 78 78)"><rect x="66" y="72" width="24" height="12" rx="6" fill="#7fb3ff" /><rect x="78" y="72" width="12" height="12" rx="0" fill="#f6f6f6" /></g></g>}
    {kind === 2 && <g><rect x="22" y="14" width="56" height="74" rx="10" fill="#2f3b52" stroke="#8fa3c4" strokeWidth="3" /><rect x="30" y="22" width="40" height="22" rx="3" fill="#a6f2a0" /><text x="50" y="38" textAnchor="middle" fontSize="12" fill="#1f3b22" fontFamily="monospace">0.67</text><circle cx="50" cy="66" r="14" fill="#f2d33c" /><g fill="#222">{[0, 120, 240].map(a => <path key={a} d="M50 66 L44 55 A13 13 0 0 1 56 55 Z" transform={`rotate(${a} 50 66)`} />)}<circle cx="50" cy="66" r="3" /></g><rect x="44" y="6" width="12" height="10" rx="2" fill="#8fa3c4" /></g>}
    {kind === 3 && <g transform="rotate(35 50 50)"><rect x="44" y="6" width="12" height="70" rx="6" fill="#f2f6fb" stroke="#9fb0c8" strokeWidth="2" /><rect x="47" y="34" width="6" height="44" fill="#e23b3b" /><circle cx="50" cy="82" r="11" fill="#e23b3b" stroke="#9fb0c8" strokeWidth="2" />{[14, 22, 30, 38, 46, 54].map(y => <path key={y} d={`M56 ${y} h5`} stroke="#6b7a90" strokeWidth="2" />)}</g>}
    {kind === 4 && <g fill="none" strokeLinecap="round"><path d="M30 12 v24 q0 22 20 22 q20 0 20 -22 v-24" stroke="#6f7d92" strokeWidth="5" /><path d="M50 58 v12 q0 16 16 16" stroke="#6f7d92" strokeWidth="5" /><circle cx="72" cy="80" r="12" fill="#c7d3e3" stroke="#6f7d92" strokeWidth="4" /><circle cx="72" cy="80" r="5" fill="#8b9ab0" /><circle cx="30" cy="10" r="4" fill="#3a3a3a" /><circle cx="70" cy="10" r="4" fill="#3a3a3a" /></g>}
  </svg>;
}

/** Medical station icons in a 100×100 box: 0 wounds, 1 illness, 2 radiation monitoring, 3 checkup. */
export function StationIcon({ kind }: { kind: number }) {
  return <svg viewBox="0 0 100 100" className="station-icon" aria-hidden="true">
    {kind === 0 && <g><path d="M8 62 Q30 44 92 40 L92 64 Q40 66 8 82 Z" fill="#e0a782" /><path d="M44 52 l14 -2" stroke="#c0392b" strokeWidth="4" strokeLinecap="round" /><rect x="36" y="43" width="30" height="16" rx="7" fill="#e8c39e" transform="rotate(-6 50 50)" opacity=".85" /><circle cx="78" cy="22" r="14" fill="#e74c3c" /><path d="M78 14 v16 M70 22 h16" stroke="#fff" strokeWidth="5" /></g>}
    {kind === 1 && <g><circle cx="46" cy="54" r="32" fill="#9ccf8a" /><circle cx="35" cy="48" r="4" fill="#2a3a2a" /><circle cx="57" cy="48" r="4" fill="#2a3a2a" /><path d="M34 68 q12 -8 24 0" stroke="#2a3a2a" strokeWidth="3.5" fill="none" /><path d="M70 30 q6 10 0 14 q-6 -4 0 -14" fill="#7fc8ff" /><g transform="rotate(30 80 70)"><rect x="76" y="44" width="8" height="40" rx="4" fill="#f2f6fb" /><circle cx="80" cy="84" r="6" fill="#e23b3b" /></g></g>}
    {kind === 2 && <g><circle cx="50" cy="50" r="40" fill="#f2d33c" stroke="#2a2a2a" strokeWidth="4" /><g fill="#2a2a2a">{[0, 120, 240].map(a => <path key={a} d="M50 50 L36 26 A28 28 0 0 1 64 26 Z" transform={`rotate(${a} 50 50)`} />)}<circle cx="50" cy="50" r="7" /></g></g>}
    {kind === 3 && <g><path d="M50 86 C18 64 8 46 14 32 C20 16 42 14 50 30 C58 14 80 16 86 32 C92 46 82 64 50 86 Z" fill="#e2566c" /><path d="M14 52 h22 l6 -14 l8 26 l8 -18 l5 6 h24" stroke="#fff" strokeWidth="4" fill="none" strokeLinejoin="round" /></g>}
  </svg>;
}

/** Astronaut bust, 120×140 box. */
export function Astronaut({ suit = '#e9edf3', visor = '#3a6fb5', badge, children }: { suit?: string; visor?: string; badge?: string; children?: React.ReactNode }) {
  return <svg viewBox="0 0 120 140" width="120" height="140" className="astronaut-art" aria-hidden="true">
    <path d="M14 140 Q14 92 60 90 Q106 92 106 140 Z" fill={suit} stroke="#9aa6b8" strokeWidth="2" />
    <rect x="44" y="104" width="32" height="20" rx="4" fill="#c8d0dc" stroke="#9aa6b8" />
    <circle cx="52" cy="114" r="3" fill="#e2412f" /><circle cx="62" cy="114" r="3" fill="#3cc27a" /><circle cx="70" cy="114" r="3" fill="#3a8fe0" />
    <circle cx="60" cy="52" r="38" fill={suit} stroke="#9aa6b8" strokeWidth="2" />
    <ellipse cx="60" cy="54" rx="27" ry="24" fill={visor} />
    <path d="M42 44 q10 -12 26 -10" stroke="#ffffff88" strokeWidth="5" fill="none" strokeLinecap="round" />
    {badge && <circle cx="92" cy="104" r="8" fill={badge} stroke="#fff" strokeWidth="2" />}
    {children}
  </svg>;
}

/** Wide illustrated Mars scene for each room's mission briefing. */
export function RoomScene({ room }: { room: TrainingRoom }) {
  return <svg viewBox="0 0 800 240" className="room-scene" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs>
      <linearGradient id="rs-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1b1730" /><stop offset=".55" stopColor="#6b3a3a" /><stop offset="1" stopColor="#d08a5a" /></linearGradient>
      <linearGradient id="rs-ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#b3603a" /><stop offset="1" stopColor="#6e3420" /></linearGradient>
      <radialGradient id="rs-sun"><stop offset="0" stopColor="#fff6d8" /><stop offset=".35" stopColor="#ffe9a8" stopOpacity=".8" /><stop offset="1" stopColor="#ffd27a" stopOpacity="0" /></radialGradient>
      <linearGradient id="rs-glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#bfe8ff" stopOpacity=".55" /><stop offset="1" stopColor="#5fa8c8" stopOpacity=".25" /></linearGradient>
    </defs>
    <rect width="800" height="240" fill="url(#rs-sky)" />
    {Array.from({ length: 26 }, (_, i) => <circle key={i} cx={(i * 137) % 800} cy={(i * 53) % 90} r={i % 3 ? .8 : 1.4} fill="#fff" opacity=".6" />)}
    <circle cx="640" cy="58" r="46" fill="url(#rs-sun)" /><circle cx="640" cy="58" r="9" fill="#fff8e0" />
    <path d="M0 150 L60 128 L130 140 L210 112 L300 136 L380 120 L470 140 L560 116 L650 134 L730 118 L800 132 V240 H0 Z" fill="#8a4a35" opacity=".8" />
    <path d="M0 170 Q120 150 250 166 T520 160 T800 168 V240 H0 Z" fill="url(#rs-ground)" />
    {[[90, 205, 16], [700, 212, 22], [520, 222, 10], [300, 226, 12]].map(([x, y, r]) => <ellipse key={x} cx={x} cy={y} rx={r} ry={r * .45} fill="#5a2a1a" />)}
    {room === 'solar' && <g>{[0, 1, 2, 3].map(i => <g key={i} transform={`translate(${250 + i * 95} 150)`}><path d="M30 18 V44" stroke="#9aa6b8" strokeWidth="5" /><g transform="skewX(-18)"><rect x="0" y="-8" width="72" height="28" fill="#1f4fa8" stroke="#cfd8e6" strokeWidth="2.5" /><path d="M18 -8 v28 M36 -8 v28 M54 -8 v28 M0 6 h72" stroke="#7fb0ff" strokeWidth="1" /></g></g>)}<path d="M640 58 L330 150" stroke="#ffe9a8" strokeWidth="2" strokeDasharray="5 7" opacity=".7" /></g>}
    {room === 'water' && <g><path d="M300 175 V100 L330 70 L360 100 V175" fill="none" stroke="#c9d2de" strokeWidth="6" /><path d="M300 130 H360 M310 110 H350" stroke="#c9d2de" strokeWidth="4" /><rect x="324" y="100" width="12" height="110" fill="#8a96a8" /><ellipse cx="330" cy="224" rx="90" ry="12" fill="#7fd3ff" opacity=".85" /><path d="M260 222 q20 -6 40 0 M350 226 q20 -5 40 0" stroke="#e9f8ff" strokeWidth="2" fill="none" /><rect x="420" y="140" width="70" height="44" rx="10" fill="#d9dee6" stroke="#8d99ab" strokeWidth="3" /><path d="M360 160 H420" stroke="#8d99ab" strokeWidth="5" /><text x="455" y="168" textAnchor="middle" fontSize="20">💧</text></g>}
    {room === 'oxygen' && <g><path d="M250 190 Q250 110 340 110 Q430 110 430 190 Z" fill="#d9dee6" stroke="#8d99ab" strokeWidth="3" /><rect x="320" y="150" width="40" height="40" rx="6" fill="#6f7d92" /><g transform="translate(470 110)"><rect x="0" y="0" width="54" height="80" rx="24" fill="#4f8fd8" stroke="#cfe0f6" strokeWidth="3" /><text x="27" y="48" textAnchor="middle" fontSize="20" fill="#fff" fontWeight="700">O₂</text></g>{[[520, 92, 7], [540, 70, 5], [508, 60, 4], [560, 48, 6]].map(([x, y, r]) => <circle key={y} cx={x} cy={y} r={r} fill="none" stroke="#bfe8ff" strokeWidth="2" />)}</g>}
    {room === 'greenhouse' && <g><path d="M240 192 Q240 92 380 92 Q520 92 520 192 Z" fill="url(#rs-glass)" stroke="#cfe8f6" strokeWidth="3" /><path d="M310 192 Q310 100 380 92 Q450 100 450 192 M240 150 H520" stroke="#cfe8f6" strokeWidth="1.5" fill="none" opacity=".7" /><rect x="262" y="104" width="236" height="6" rx="3" fill="#ff5a8a" opacity=".85" /><rect x="262" y="100" width="236" height="88" fill="#ff7ab0" opacity=".08" />{[0, 1, 2, 3, 4].map(i => <Plant key={i} kind={i % 3} x={290 + i * 45} y={188} scale={.75} />)}</g>}
    {room === 'medical' && <g><rect x="270" y="120" width="220" height="72" rx="30" fill="#e6eaf0" stroke="#8d99ab" strokeWidth="3" /><circle cx="330" cy="156" r="16" fill="#7fbfe8" stroke="#8d99ab" strokeWidth="3" /><circle cx="430" cy="156" r="16" fill="#7fbfe8" stroke="#8d99ab" strokeWidth="3" /><rect x="364" y="132" width="32" height="48" rx="4" fill="#fff" /><path d="M380 140 V172 M364 156 H396" stroke="#e23b3b" strokeWidth="9" /></g>}
    {room === 'research' && <g><path d="M300 190 V140" stroke="#9aa6b8" strokeWidth="6" /><g transform="rotate(-25 300 135)"><path d="M250 120 Q300 175 350 120" fill="#d9dee6" stroke="#8d99ab" strokeWidth="3" /><path d="M300 148 V100" stroke="#f2d33c" strokeWidth="3" /></g><path d="M330 110 Q470 40 610 64" stroke="#7fd3ff" strokeWidth="2" strokeDasharray="6 8" fill="none" /><circle cx="560" cy="40" r="7" fill="#4f8fd8" /><g transform="translate(420 160)"><rect x="0" y="0" width="70" height="22" rx="5" fill="#d9dee6" stroke="#8d99ab" /><circle cx="12" cy="28" r="8" fill="#3a3f4a" /><circle cx="35" cy="28" r="8" fill="#3a3f4a" /><circle cx="58" cy="28" r="8" fill="#3a3f4a" /><path d="M55 0 V-22 h10" stroke="#8d99ab" strokeWidth="4" fill="none" /></g></g>}
  </svg>;
}
