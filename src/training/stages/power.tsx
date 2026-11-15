import { useRef, useState } from 'react';
import { Slider } from '../Slider';
import { CIRCUIT_ROCK, CIRCUIT_SIZE, cableComplete, circuitCables, circuitConnected, circuitNeighbours, circuitPortAt, lightCapture, sunAngle } from '../engine';
import type { StageProps } from './common';
import { Btn, Meter, Play } from './common';

export function DustStage({ t, send }: StageProps) {
  const v = t.values, dust = v.reduce((a, b) => a + b, 0), capacity=t.hard?36:24, light = Math.max(0,Math.round((capacity - dust) / capacity * 100));
  return <Play vis={<>
    <div className="pv-stage">
      <svg viewBox="0 0 600 120" className="stage-svg" aria-hidden="true">
        <defs><linearGradient id="pv-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2a1f3a" /><stop offset="1" stopColor="#b8704a" /></linearGradient>
          <radialGradient id="pv-sun"><stop offset="0" stopColor="#fff7d6" /><stop offset=".4" stopColor="#ffe39a" stopOpacity=".7" /><stop offset="1" stopColor="#ffd27a" stopOpacity="0" /></radialGradient></defs>
        <rect width="600" height="120" fill="url(#pv-sky)" />
        <circle cx="70" cy="50" r="48" fill="url(#pv-sun)" /><circle cx="70" cy="50" r="12" fill="#fff8e0" />
        {[0, 1, 2, 3, 4].map(i => <path key={i} d={`M100 ${40 + i * 8} L${330 + i * 30} 120`} stroke="#ffe9a8" strokeWidth="2" opacity={light / 100 * .8} strokeDasharray="6 6" className="ray-flow" />)}
        {Array.from({ length: Math.round(dust * 1.5) }, (_, i) => <circle key={i} cx={180 + (i * 47) % 380} cy={20 + (i * 31) % 90} r={1.5 + i % 3} fill="#c88a5a" opacity=".55" className="dust-drift" style={{ animationDelay: `${i * .17}s` }} />)}
        <text x="580" y="30" textAnchor="end" className="svg-label">LIGHT → ELECTRICITY</text>
      </svg>
      <div className="pv-frame">
        <div className="pv-array" onPointerMove={e => { if (e.buttons === 1) { const cell = (document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null)?.closest<HTMLElement>('[data-cell]'); if (cell) send('wipe', Number(cell.dataset.cell)); } }}>
          {v.map((d, i) => <button data-cell={i} aria-label={`Brush panel cell ${i + 1}${d ? '' : ', clean'}`} key={i} className={`pv-cell dust-${Math.min(2,d)}`} onPointerDown={() => send('wipe', i)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); send('wipe', i); } }}>
            <span className="pv-dust" /><small>{d >= 2 ? 'DUSTY' : d === 1 ? 'ALMOST' : '✓'}</small>
          </button>)}
        </div>
        <div className="pv-legs"><span /><span /></div>
      </div>
    </div>
</>} controls={<>
    <Meter label="⚡ Power from the array" value={light} unit="%" color={light > 80 ? '#5fe08a' : light > 40 ? '#f2d33c' : '#e2573b'} />
    {t.hard&&<p className="hard-stage-rules">Storm repair: three dust layers per cell and two returning gusts. Clear every layer before the deadline.</p>}<p className="stage-caption">Hold the mouse button and sweep across the panel, or tap the cells.</p>
  </>} />;
}

export function SunStage({ t, send, running, setRunning }: StageProps) {
  const v = t.values, sun = sunAngle(t.time), capture = lightCapture(v[0], t.time), aligned = Math.abs(v[0] - sun) <= 12;
  // The Sun moves on an arc centred on the panel, so facing it means the panel's normal points straight at it.
  const px = 300, py = 226, R = 165, view = (deg: number) => (deg - 45) * 1.6, rad = (deg: number) => view(deg) * Math.PI / 180;
  const sx = px + R * Math.sin(rad(sun)), sy = py - R * Math.cos(rad(sun)), ax = px + R * Math.sin(rad(0)), ay = py - R * Math.cos(rad(0)), bx = px + R * Math.sin(rad(90));
  return <Play vis={<>
    <svg viewBox="0 0 600 300" className="stage-svg" aria-label={`Sun at ${sun} degrees, panel at ${v[0]} degrees`}>
      <defs><linearGradient id="sun-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1b1730" /><stop offset=".7" stopColor="#7a4a3a" /><stop offset="1" stopColor="#d08a5a" /></linearGradient>
        <radialGradient id="sun-glow"><stop offset="0" stopColor="#fff7d6" /><stop offset=".35" stopColor="#ffe39a" stopOpacity=".8" /><stop offset="1" stopColor="#ffd27a" stopOpacity="0" /></radialGradient>
        <pattern id="pv-cells" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="#1f4fa8" /><path d="M0 0 H20 V20" fill="none" stroke="#7fb0ff" strokeWidth="1" /></pattern></defs>
      <rect width="600" height="300" fill="url(#sun-sky)" />
      <path d={`M${ax} ${ay} A${R} ${R} 0 0 1 ${bx} ${ay}`} fill="none" stroke="#ffffff44" strokeDasharray="4 7" />
      <text x={ax - 8} y={ay + 20} className="svg-label" textAnchor="middle">EAST</text><text x={bx + 8} y={ay + 20} className="svg-label" textAnchor="middle">WEST</text>
      <path d={`M${sx} ${sy} L${px} ${py}`} stroke="#ffe9a8" strokeWidth={2 + capture * 8} opacity={.2 + capture * .7} strokeLinecap="round" className="ray-flow" strokeDasharray="10 8" />
      <circle cx={sx} cy={sy} r="46" fill="url(#sun-glow)" /><circle cx={sx} cy={sy} r="15" fill="#fff4c4" />
      
      <path d="M0 262 Q150 246 300 258 T600 254 V300 H0 Z" fill="#9a5236" />
      <path d="M300 226 V280 M270 282 H330" stroke="#a8b2c4" strokeWidth="7" strokeLinecap="round" />
      <g transform={`translate(${px} ${py}) rotate(${view(v[0])})`}>
        <rect x="-62" y="-9" width="124" height="18" fill="url(#pv-cells)" stroke={aligned ? '#5fe08a' : '#cfd8e6'} strokeWidth="4" rx="2" />
        <path d={`M0 -9 V-${R - 20}`} stroke={aligned ? '#5fe08a' : '#ffffff55'} strokeWidth="2" strokeDasharray="3 6" />
      </g>
      <text x="14" y="24" className="svg-label">SUN {sun}°   PANEL {v[0]}°   {aligned ? '✓ FACING THE SUN' : ''}</text>
    </svg>
</>} controls={<>
    <Slider label="Panel angle" max={90} value={v[0]} onChange={value => send('angle', undefined, value)} />
    <Meter label="☀ Light captured" value={Math.round(capture * 100)} unit="%" color={aligned ? '#5fe08a' : '#f2a33c'} />
    <div className="stage-readouts"><div className="progress-ring" style={{ '--p': `${Math.min(15, v[1]) / 15 * 100}%` } as React.CSSProperties}><strong>{Math.min(15, v[1]).toFixed(1)}</strong><small>/ 15 s</small></div>
      <Btn primary onClick={() => setRunning(!running)}>{running ? '⏸ Pause tracking' : '▶ Start tracking'}</Btn></div>
  </>} />;
}

const cableColors = ['', '#ef4b4b', '#3d8bff', '#f2c230', '#3cc27a', '#b06cff'];
const portIcons: Record<string, string> = { 'Solar array': '☀️', 'Charge controller': '⚙️', Battery: '🔋', 'Oxygen maker': '🫧', 'Water pump': '💧', 'Habitat lights': '💡' };
const cellXY = (cell: number) => [Math.floor(cell % CIRCUIT_SIZE) * 100 + 50, Math.floor(cell / CIRCUIT_SIZE) * 100 + 50];

export function BatteryStage({ t, send }: StageProps) {
  const v = t.values, [active, setActive] = useState(0), drag = useRef<{ color: number; last: number } | null>(null), painted = useRef(new Set<number>());
  const all = circuitConnected(v);
  const cellAt = (x: number, y: number) => { const el = (document.elementFromPoint(x, y) as Element | null)?.closest('[data-cell]'); return el ? Number(el.getAttribute('data-cell')) : -1; };
  const free = (cell: number) => v[cell] === 0 && !painted.current.has(cell);
  const extend = (cell: number) => {
    const d = drag.current; if (!d || cell < 0 || cell === d.last) return;
    // Walk towards the pointer one orthogonal step at a time so fast drags do not skip squares.
    let guard = 0;
    while (d.last !== cell && guard++ < 12) {
      const [lr, lc] = [Math.floor(d.last / CIRCUIT_SIZE), d.last % CIRCUIT_SIZE], [cr, cc] = [Math.floor(cell / CIRCUIT_SIZE), cell % CIRCUIT_SIZE];
      const step = lr !== cr ? d.last + Math.sign(cr - lr) * CIRCUIT_SIZE : d.last + Math.sign(cc - lc);
      const port = circuitPortAt(step);
      if (port && port.cable.color === d.color) { d.last = step; drag.current = null; return; }
      if (!free(step)) return;
      painted.current.add(step); send('draw', step, d.color); d.last = step;
    }
  };
  const start = (cell: number) => {
    if (cell < 0) return; painted.current = new Set();
    const port = circuitPortAt(cell);
    if (port) { send('erase', undefined, port.cable.color); setActive(port.cable.color); drag.current = { color: port.cable.color, last: cell }; return; }
    if (v[cell] > 0) { setActive(v[cell]); drag.current = { color: v[cell], last: cell }; return; }
    // Click mode: extend the active cable into an empty neighbouring square.
    if (active && v[cell] === 0 && circuitNeighbours(cell).some(n => v[n] === active)) { send('draw', cell, active); }
  };
  const segments: [number, number, number][] = [];
  v.forEach((c, cell) => { if (c > 0) for (const n of circuitNeighbours(cell)) if (n > cell && v[n] === c) segments.push([cell, n, c]); });
  return <Play vis={<>
    <svg viewBox="0 0 600 600" className={`circuit-board ${all ? 'powered' : ''}`} style={{ touchAction: 'none' }} aria-label="Cable board"
        onPointerDown={e => { e.preventDefault(); start(cellAt(e.clientX, e.clientY)); }}
        onPointerMove={e => { if (drag.current && e.buttons) extend(cellAt(e.clientX, e.clientY)); }}
        onPointerUp={() => { drag.current = null; }} onPointerLeave={() => { drag.current = null; }}>
        <rect width="600" height="600" fill="#0f2a1f" rx="18" />
        {v.map((_, cell) => { const [x, y] = cellXY(cell); return <rect key={cell} data-cell={cell} x={x - 48} y={y - 48} width="96" height="96" rx="10" fill={cell === CIRCUIT_ROCK ? '#3b2a22' : '#163a2b'} stroke="#2d5c45" strokeWidth="2" />; })}
        {[0, 1, 2, 3, 4, 5].map(i => <g key={i} opacity=".35">{[0, 1, 2, 3, 4, 5].map(j => <circle key={j} cx={i * 100 + 50} cy={j * 100 + 50} r="3" fill="#7fbf9a" pointerEvents="none" />)}</g>)}
        <g pointerEvents="none">
          <g transform="translate(150 350)"><path d="M-36 6 l14 -28 l30 -8 l26 16 l4 26 l-26 16 l-36 -4 Z" fill="#7a5a48" stroke="#a9876e" strokeWidth="3" /><path d="M-14 -10 l12 4 l10 -6" stroke="#5a4034" strokeWidth="3" fill="none" /></g>
          <text x="150" y="392" textAnchor="middle" className="port-label">ROCK · NO CABLES</text>
          {segments.map(([a, b, c]) => { const [x1, y1] = cellXY(a), [x2, y2] = cellXY(b); return <g key={`${a}-${b}`}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#00000066" strokeWidth="30" strokeLinecap="round" />
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={cableColors[c]} strokeWidth="24" strokeLinecap="round" />
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ffffffaa" strokeWidth="5" strokeLinecap="round" strokeDasharray="6 22" className={cableComplete(v, c) ? 'current-flow' : ''} />
          </g>; })}
          {circuitCables.map(c => c.ports.map((p, end) => { const [x, y] = cellXY(p), done = cableComplete(v, c.color), label = end ? c.to : c.from; return <g key={`${c.color}-${p}`} className={done ? 'port-done' : ''}>
            <circle cx={x} cy={y - 8} r="28" fill="#0b1a14" stroke={cableColors[c.color]} strokeWidth={active === c.color ? 8 : 5} />
            <text x={x} y={y - 1} textAnchor="middle" fontSize="22">{portIcons[label]}</text>
            <rect x={x - 46} y={y + 25} width="92" height="15" rx="4" fill="#0b1a14cc" />
            <text x={x} y={y + 36} textAnchor="middle" className="port-label">{label.toUpperCase()}</text>
          </g>; }))}
        </g>
      </svg>
</>} controls={<>
      <aside className="cable-list">
        <strong>POWER NETWORK</strong>
        {circuitCables.map(c => { const done = cableComplete(v, c.color); return <button type="button" key={c.color} className={`cable-item ${done ? 'done' : ''} ${active === c.color ? 'selected' : ''}`} onClick={() => setActive(c.color)}>
          <span className="cable-swatch" style={{ background: cableColors[c.color] }} />
          <span>{portIcons[c.from]} {c.from}<br /><small>→ {portIcons[c.to]} {c.to}</small></span>
          <b>{done ? '✓' : '…'}</b>
        </button>; })}
        <p className={`circuit-status ${all ? 'ok' : ''}`}>{all ? '⚡ Circuit closed: ready to switch on!' : `${circuitCables.filter(c => cableComplete(v, c.color)).length} / 5 cables connected`}</p>
      </aside>
    <div className="stage-buttons">
      <Btn onClick={() => circuitCables.forEach(c => send('erase', undefined, c.color))}>Remove all cables</Btn>
      <Btn primary onClick={() => send('connect')}>⚡ Switch on the network</Btn>
    </div>
  </>} />;
}
