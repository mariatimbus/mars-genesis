import { useState } from 'react';
import { Slider } from '../Slider';
import { gravityNotes, kitTargets } from '../engine';
import { Astronaut, StationIcon, ToolIcon } from '../art';
import type { StageProps } from './common';
import { Btn, Play } from './common';

const tools = [
  { name: 'Bandage', use: 'Covers and protects a cut' },
  { name: 'Medicine', use: 'Treats illness and pain' },
  { name: 'Dosimeter', use: 'Measures radiation received' },
  { name: 'Thermometer', use: 'Measures body temperature' },
  { name: 'Stethoscope', use: 'Listens to heart and lungs' }
];
const stations = [
  { name: 'Wounds', note: 'Cuts and scrapes' },
  { name: 'Illness', note: 'Feeling sick' },
  { name: 'Radiation monitoring', note: 'How much radiation?' },
  { name: 'Checkup', note: 'Is everyone healthy?' }
];

export function KitStage({ t, send }: StageProps) {
  const [selected, setSelected] = useState(-1), m = t.marks;
  return <Play vis={<>
    <div className="kit-tools">{tools.map((tool, i) => <button type="button" key={tool.name} disabled={m.includes(i)} aria-pressed={selected === i} className={`kit-tool ${selected === i ? 'selected' : ''} ${m.includes(i) ? 'placed' : ''}`} onClick={() => setSelected(i)}>
      <ToolIcon kind={i} /><b>{m.includes(i) ? '✓ ' : ''}{tool.name}</b><small>{tool.use}</small>
    </button>)}</div>
    <p className="stage-caption">{selected >= 0 ? `Where does the ${tools[selected].name.toLowerCase()} go? Pick a station ↓` : 'Pick a tool from the box ↑'}</p>
</>} controls={<>
    <div className="kit-stations">{stations.map((s, i) => <button type="button" key={s.name} className="kit-station" disabled={selected < 0} onClick={() => { send('match', selected, i); setSelected(-1); }}>
      <StationIcon kind={i} /><b>{s.name}</b><small>{s.note}</small>
      <span className="station-shelf">{m.filter(k => kitTargets[k] === i).map(k => <ToolIcon key={k} kind={k} />)}</span>
    </button>)}</div>
  </>} />;
}

const zones = [
  { icon: '💪', name: 'Muscles', label: 'Muscle strength' },
  { icon: '🦴', name: 'Bones', label: 'Bone density' },
  { icon: '🦵', name: 'Joints', label: 'Joint flexibility' }
];
/** Illustrative 30-sol trend. Bone loss uses NASA's ~1.5%/month microgravity figure; muscle and joint values are a teaching scale. */
const gravityValues = (k: number, exercise: boolean) => exercise ? [100 - 2 * k, 100 - .3 * k, 100] : [100 - 20 * k, 100 - 1.5 * k, 100 - 12 * k];
const pct = (v: number, i: number) => `${v.toFixed(i === 1 ? 1 : 0)}%`;

function AlexFigure({ x, k, exercise, zone, onZone }: { x: number; k: number; exercise: boolean; zone: number; onZone: (i: number) => void }) {
  const loss = exercise ? 0 : k, arm = 17 - 8 * loss, leg = 24 - 11 * loss, torso = 64 - 10 * loss, slouch = 7 * loss;
  const glow = (i: number) => zone === i ? 'zone-on' : '';
  return <g transform={`translate(${x} 0)`}>
    <ellipse cx="0" cy="292" rx="70" ry="9" fill="#0006" />
    {exercise && <g><rect x="-70" y="284" width="140" height="10" rx="5" fill="#3a4458" /><path d="M-60 289 h120" stroke="#5a6680" strokeWidth="2" strokeDasharray="8 6" className="ray-flow" /></g>}
    <g transform={`rotate(${slouch} 0 280)`}>
      <g className={exercise ? 'lift' : ''}>
        {[-1, 1].map(s => <g key={s}>
          <path d={`M${s * 14} 178 L${s * 18} 232 L${s * 16} 280`} stroke="#2f4a7a" strokeWidth={leg} strokeLinecap="round" fill="none" />
          <rect x={s * 18 - 18} y="274" width="36" height="12" rx="6" fill="#e9edf3" />
        </g>)}
        <rect x={-torso / 2} y="88" width={torso} height="96" rx="20" fill={exercise ? '#e2803a' : '#b07a5a'} />
        <text x="0" y="140" textAnchor="middle" fontSize="13" fill="#fff" fontWeight="700">ALEX</text>
        {[-1, 1].map(s => <g key={s}>
          <path d={exercise ? `M${s * (torso / 2 - 4)} 100 L${s * (torso / 2 + 22)} 128 L${s * (torso / 2 + 14)} 84` : `M${s * (torso / 2 - 4)} 100 L${s * (torso / 2 + 10)} 146 L${s * (torso / 2 + 8)} 188`} stroke="#e0a782" strokeWidth={arm} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          {exercise && <g transform={`translate(${s * (torso / 2 + 14)} 80)`}><rect x="-16" y="-3" width="32" height="6" fill="#5a6272" /><rect x="-20" y="-10" width="8" height="20" rx="2" fill="#3a3f4a" /><rect x="12" y="-10" width="8" height="20" rx="2" fill="#3a3f4a" /></g>}
        </g>)}
        <circle cx="0" cy="60" r="25" fill="#e0a782" />
        <path d="M-25 54 Q-22 30 0 32 Q22 30 25 54 Q14 42 0 44 Q-14 42 -25 54 Z" fill="#4a2e1e" />
        <circle cx="-9" cy="60" r="3" fill="#2a1a10" /><circle cx="9" cy="60" r="3" fill="#2a1a10" />
        <path d={`M-9 72 Q0 ${80 - 10 * loss} 9 72`} stroke="#7a3a2a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {!exercise && loss > .5 && <path d="M22 44 q4 8 0 12 q-4 -4 0 -12" fill="#7fc8ff" />}
        <ellipse cx={-14} cy="200" rx="16" ry="24" className={`body-zone ${glow(0)}`} onClick={() => onZone(0)} />
        <ellipse cx={14} cy="200" rx="16" ry="24" className={`body-zone ${glow(0)}`} onClick={() => onZone(0)} />
        <g className={`body-zone ${glow(1)}`} onClick={() => onZone(1)}><rect x={-28} y="242" width="22" height="34" rx="8" /><rect x={6} y="242" width="22" height="34" rx="8" /></g>
        {zone === 1 && [-17, 17].map(s => <g key={s} pointerEvents="none"><rect x={s - 3} y="244" width="6" height="30" rx="3" fill="#fff" opacity=".9" />{Array.from({ length: exercise ? 6 : Math.max(1, Math.round(6 - 5 * loss)) }, (_, i) => <circle key={i} cx={s + (i % 2 ? 1.5 : -1.5)} cy={247 + i * 5} r="1.3" fill="#a08a6a" />)}</g>)}
        <circle cx={-18} cy="232" r="10" className={`body-zone ${glow(2)}`} onClick={() => onZone(2)} />
        <circle cx={18} cy="232" r="10" className={`body-zone ${glow(2)}`} onClick={() => onZone(2)} />
      </g>
    </g>
  </g>;
}

export function GravityStage({ t, send }: StageProps) {
  const [zone, setZone] = useState(-1), sol = t.values[0], k = (sol - 1) / 29, m = t.marks;
  const tap = (i: number) => { setZone(i); send('zone', i); };
  const without = gravityValues(k, false), withEx = gravityValues(k, true);
  return <Play vis={<>
    <svg viewBox="0 0 600 340" className="stage-svg" aria-label={`Two Alex figures on sol ${sol}`}>
      <defs><linearGradient id="grav-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1a2340" /><stop offset="1" stopColor="#2a1e2a" /></linearGradient></defs>
      <rect width="600" height="340" fill="url(#grav-bg)" />
      <path d="M300 36 V290" stroke="#ffffff22" strokeWidth="2" strokeDasharray="6 8" />
      <text x="150" y="24" textAnchor="middle" className="warn-label">NO EXERCISE</text>
      <text x="450" y="24" textAnchor="middle" className="ok-label">EXERCISES EVERY DAY</text>
      <AlexFigure x={150} k={k} exercise={false} zone={zone} onZone={tap} />
      <AlexFigure x={450} k={k} exercise={true} zone={zone} onZone={tap} />
      <g transform="translate(300 318)"><rect x="-52" y="-16" width="104" height="26" rx="13" fill="#0b1424" stroke="#f2d33c" strokeWidth="2" /><text y="3" textAnchor="middle" fontSize="15" fontWeight="700" fill="#f2d33c">SOL {sol} / 30</text></g>
    </svg>
    <div className="gravity-compare">{zones.map((z, i) => <div key={z.name} className={zone === i ? 'on' : ''}>
      <span>{z.icon} {z.label}</span>
      <div><i style={{ width: `${without[i]}%` }} className="bad" /><b>{pct(without[i], i)}</b></div>
      <div><i style={{ width: `${withEx[i]}%` }} className="good" /><b>{pct(withEx[i], i)}</b></div>
    </div>)}</div>
  </>} controls={<>
    <Slider label="Time on Mars" max={29} value={sol - 1} format={v => `Sol ${v + 1} / 30`} onChange={value => send('sol', undefined, value + 1)} />
    <strong className="side-title">TAP A BODY ZONE (on Alex or here)</strong>
    <div className="zone-buttons">{zones.map((z, i) => <button type="button" key={z.name} className={zone === i ? 'selected' : ''} onClick={() => tap(i)}><span>{z.icon}</span>{z.name}{m.includes(i) ? ' ✓' : ''}</button>)}</div>
    <div className="maya-card"><b>👩‍🚀 MAYA</b><p>{zone >= 0 ? gravityNotes[zone].replace(/^Maya: /, '') : 'Two Alex twins: same food, same base. Only one exercises. Slide through the sols and tap the body to see what changes.'}</p>
      {zone >= 0 && <small>Sol {sol}: without exercise {pct(without[zone], zone)} · with exercise {pct(withEx[zone], zone)}</small>}</div>
    <div className="nasa-fact"><b>🚀 NASA SCIENCE FACT</b><p>In microgravity, astronauts can lose about 1–1.5% of their bone mineral density every month without exercise. That is why ISS crews exercise about 2 hours every day.</p></div>
    <ol className="step-track">{([['Reach Sol 30', m.includes(10)], ['Muscles', m.includes(0)], ['Bones', m.includes(1)], ['Joints', m.includes(2)]] as [string, boolean][]).map(([label, ok], i) => <li key={label} className={ok ? 'ok' : ''}><b>{ok ? '✓' : i + 1}</b>{label}</li>)}</ol>
  </>} />;
}

const crew = [
  { name: 'Maya', issue: 'Weak leg muscles', body: 'muscle', suit: '#e9edf3' },
  { name: 'Alex', issue: 'Very tired, poor sleep', body: 'sleep', suit: '#f2d9a0' },
  { name: 'Sam', issue: 'Radiation badge alert', body: 'rad', suit: '#cfe3f6' }
];
const supports = [['💪', 'Exercise', 'Rebuilds muscle and bone'], ['🛏️', 'Rest', 'Sleep helps the body recover'], ['🛡️', 'Protective shelter', 'Stops more radiation from adding up']];

export function CheckupStage({ t, send }: StageProps) {
  const [selected, setSelected] = useState(0), m = t.marks;
  return <Play vis={<>
    <div className="crew-row">{crew.map((c, i) => { const scanned = m.includes(i + 10), done = m.includes(i); return <button type="button" key={c.name} className={`crew-card ${selected === i ? 'selected' : ''} ${done ? 'done' : ''}`} onClick={() => { setSelected(i); if (!scanned) send('scan', i); }}>
      <div className="crew-portrait">
        <Astronaut suit={c.suit} badge={c.body === 'rad' && scanned ? '#f2d33c' : undefined}>
          {scanned && c.body === 'sleep' && <text x="92" y="24" fontSize="18" fill="#bfe8ff" className="pulse">z z</text>}
          {scanned && c.body === 'muscle' && <><path d="M24 128 q6 -16 14 -20" stroke="#ff5a5a" strokeWidth="6" strokeLinecap="round" className="pulse" /><path d="M96 128 q-6 -16 -14 -20" stroke="#ff5a5a" strokeWidth="6" strokeLinecap="round" className="pulse" /></>}
          {scanned && c.body === 'rad' && <circle cx="92" cy="104" r="14" fill="none" stroke="#f2d33c" strokeWidth="3" className="pulse" />}
        </Astronaut>
        {!scanned && <span className="scan-line" />}
      </div>
      <b>{c.name}</b>
      <small>{done ? '✓ Supported' : scanned ? `⚠ ${c.issue}` : 'Click to scan'}</small>
    </button>; })}</div>
</>} controls={<>
    <p className="stage-caption">{m.includes(selected + 10) ? `${crew[selected].name}: ${crew[selected].issue}. What helps?` : `Scan ${crew[selected].name} first.`}</p>
    <div className="support-cards">{supports.map(([icon, label, note], i) => <button type="button" key={label} disabled={!m.includes(selected + 10) || m.includes(selected)} onClick={() => send('match', selected, i)}>
      <span>{icon}</span><b>{label}</b><small>{note}</small>
    </button>)}</div>
  </>} />;
}
