import { useState } from 'react';
import { Slider } from '../Slider';
import { irrigationBands } from '../engine';
import { Plant, plantInfo, type PlantHealth } from '../art';
import type { StageProps } from './common';
import { Btn, Meter, Play } from './common';

export function LightsStage({ t, send }: StageProps) {
  const [red, blue, green] = t.values, total = red + blue + green, over = total > 130;
  const growth = Math.min(1, red / 50) * Math.min(1, blue / 30), mix = `rgb(${Math.round(red * 2.55)},${Math.round(green * 2.55)},${Math.round(blue * 2.55)})`;
  const health: PlantHealth = growth >= 1 ? 'good' : 'dark';
  const X = (nm: number) => 40 + (nm - 400) / 300 * 520;
  // Simplified chlorophyll absorption shape: strong blue and red peaks, low in green.
  const curve = Array.from({ length: 61 }, (_, i) => { const nm = 400 + i * 5, a = .95 * Math.exp(-(((nm - 435) / 28) ** 2)) + .75 * Math.exp(-(((nm - 665) / 18) ** 2)) + .08; return `${i ? 'L' : 'M'}${X(nm)} ${130 - a * 100}`; }).join(' ');
  return <Play vis={<>
    <svg viewBox="0 0 600 230" className="stage-svg" aria-label="Grow chamber">
      <defs><linearGradient id="cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={mix} stopOpacity={Math.min(.75, total / 160)} /><stop offset="1" stopColor={mix} stopOpacity="0.05" /></linearGradient></defs>
      <rect width="600" height="230" fill="#0b0f1a" rx="10" />
      <rect x="90" y="20" width="420" height="22" rx="6" fill="#2a3245" stroke="#8d99ab" strokeWidth="2" />
      {Array.from({ length: 18 }, (_, i) => { const c = i % 3 === 0 ? ['#ff3a3a', red] : i % 3 === 1 ? ['#3a6bff', blue] : ['#3aff7a', green]; return <circle key={i} cx={105 + i * 23} cy="31" r="6" fill={c[0] as string} opacity={.15 + (c[1] as number) / 115} />; })}
      <path d="M100 42 L500 42 L570 200 L30 200 Z" fill="url(#cone)" />
      <rect x="40" y="196" width="520" height="24" rx="4" fill="#4a3426" />
      {[0, 1, 2, 3, 4].map(i => <Plant key={i} kind={0} x={110 + i * 95} y={200} scale={.6 + growth * .7} health={health} />)}
      <text x="300" y="224" textAnchor="middle" className={growth >= 1 ? 'ok-label' : 'svg-label'}>{growth >= 1 ? 'LEAVES ARE GROWING WELL' : red < 50 ? 'PLANTS NEED MORE RED LIGHT' : 'PLANTS NEED MORE BLUE LIGHT'}</text>
    </svg>
    <svg viewBox="0 0 600 160" className="stage-svg spectrum" aria-label="Light the leaves absorb">
      <defs><linearGradient id="rainbow" x1="0" x2="1"><stop offset="0" stopColor="#7a3aff" /><stop offset=".2" stopColor="#3a6bff" /><stop offset=".45" stopColor="#3aff7a" /><stop offset=".6" stopColor="#f2e23a" /><stop offset=".8" stopColor="#ff8a3a" /><stop offset="1" stopColor="#ff3a3a" /></linearGradient></defs>
      <rect width="600" height="160" fill="#0b0f1a" rx="10" />
      <rect x="40" y="132" width="520" height="8" fill="url(#rainbow)" />
      {[[450, blue, '#3a6bff', 'BLUE'], [530, green, '#3aff7a', 'GREEN'], [660, red, '#ff3a3a', 'RED']].map(([nm, val, c, l]) => <g key={l as string}><rect x={X(nm as number) - 16} y={130 - (val as number)} width="32" height={val as number} fill={c as string} opacity=".55" rx="3" /><text x={X(nm as number)} y="156" textAnchor="middle" className="svg-label">{l as string} {val as number}</text></g>)}
      <path d={curve} stroke="#ffffff" strokeWidth="3" fill="none" />
      <text x="300" y="20" textAnchor="middle" className="svg-label">WHITE LINE = LIGHT THAT LEAVES ABSORB · BARS = YOUR LAMPS</text>
      <text x="300" y="44" textAnchor="middle" className="chart-note">Leaves reflect most green light. That is why they look green!</text>
    </svg>
</>} controls={<>
    {['Red light', 'Blue light', 'Green inspection light'].map((label, i) => <Slider key={label} label={label} value={t.values[i]} onChange={value => send('light', i, value)} />)}
    <Meter label="⚡ Lighting budget used" value={total} max={130} unit={` / 130`} color={over ? '#e2573b' : '#5fe08a'} />
    <div className="stage-buttons"><Btn primary onClick={() => send('test')}>🌱 Test the light recipe</Btn></div>
  </>} />;
}

export function PlantStage({ t, send }: StageProps) {
  const [selected, setSelected] = useState(0), v = t.values;
  const planted = v.filter(x => x >= 0), unique = new Set(planted).size;
  return <Play vis={<>
    <div className="seed-packets">{plantInfo.map((p, i) => <button type="button" key={p.name} className={`seed-packet ${selected === i ? 'selected' : ''}`} aria-pressed={selected === i} onClick={() => setSelected(i)}>
      <svg viewBox="-50 -80 100 90" aria-hidden="true"><rect x="-50" y="-80" width="100" height="90" fill={p.color} opacity=".18" /><Plant kind={i} scale={1.05} y={2} /></svg>
      <b>{p.name}</b><small>⏱ Harvest in ~{p.days} days</small><em>{p.tag}</em>
    </button>)}</div>
    <div className="bed-row">{v.map((seed, i) => <button type="button" key={i} className="plant-bed" onClick={() => send('seed', i, selected)}>
      <svg viewBox="-60 -80 120 110" aria-hidden="true">
        <rect x="-60" y="-80" width="120" height="110" fill="#ff7ab0" opacity=".06" />
        <path d="M-56 0 H56 L48 28 H-48 Z" fill="#6e4a2e" stroke="#8a6040" strokeWidth="3" />
        <ellipse cx="0" cy="0" rx="56" ry="6" fill="#4a3020" />
        {seed >= 0 ? <Plant kind={seed} scale={.95} y={0} /> : <text y="-24" textAnchor="middle" fontSize="30" fill="#8d99ab">＋</text>}
      </svg>
      <small>BED {i + 1}</small>{seed >= 0 ? plantInfo[seed].name : `Plant ${plantInfo[selected].short}`}
    </button>)}</div>
</>} controls={<>
    <div className="harvest-timeline">
      <span>HARVEST TIMELINE</span>
      <div className="timeline-track">{[0, 25, 50, 75, 100].map(d => <i key={d} style={{ left: `${d / 110 * 100}%` }}>{d}d</i>)}
        {v.map((seed, i) => seed >= 0 && <b key={i} style={{ left: `${plantInfo[seed].days / 110 * 100}%`, background: plantInfo[seed].color, top: `${4 + i * 12}px` }} title={plantInfo[seed].name} />)}</div>
      <small>{unique === 3 ? '✓ Fresh food early AND a long research crop' : `${unique} different crop${unique === 1 ? '' : 's'} planted · a varied garden is safer`}</small>
    </div>
    <div className="stage-buttons"><Btn primary onClick={() => send('test')}>✓ Confirm planting plan</Btn></div>
  </>} />;
}

function Pot({ kind, water, band }: { kind: number; water: number; band: number[] }) {
  const state: PlantHealth = water < band[0] ? 'dry' : water > band[1] ? 'wet' : 'good';
  const soil = `hsl(25 ${35 + water / 4}% ${42 - water / 4}%)`, root = state === 'dry' ? '#a07848' : state === 'wet' ? '#5a6a6a' : '#f2ead8';
  return <svg viewBox="0 0 160 250" className="pot-svg" aria-hidden="true">
    <rect width="160" height="250" fill="#0b1424" rx="8" />
    <Plant kind={kind} x={80} y={92} scale={1.05} health={state} />
    <path d="M18 92 H142 L128 236 H32 Z" fill={soil} stroke="#8d99ab" strokeWidth="3" />
    <clipPath id={`pot-${kind}`}><path d="M18 92 H142 L128 236 H32 Z" /></clipPath>
    <g clipPath={`url(#pot-${kind})`}>
      <rect x="0" y={236 - water * 1.44} width="160" height={water * 1.44} fill="#3d8bff" opacity={.25 + water / 300} />
      {state !== 'wet' && Array.from({ length: 9 }, (_, i) => <circle key={i} cx={34 + (i * 41) % 96} cy={110 + (i * 29) % 110} r="3" fill="#fff" opacity=".35" />)}
      {state === 'dry' && <path d="M40 100 l10 18 l-6 14 M110 104 l-8 16 l8 12" stroke="#3a2416" strokeWidth="2" fill="none" />}
      {[-30, -12, 8, 26].map((dx, i) => <path key={i} d={`M80 94 C${80 + dx / 2} 130 ${80 + dx} 150 ${80 + dx * 1.4} ${170 + i * 12}`} stroke={root} strokeWidth="3" fill="none" />)}
    </g>
    <text x="80" y="20" textAnchor="middle" className={state === 'good' ? 'ok-label' : 'warn-label'}>{state === 'good' ? 'HEALTHY ROOTS' : state === 'dry' ? 'TOO DRY' : 'SOAKED · NO AIR'}</text>
  </svg>;
}

export function IrrigateStage({ t, send }: StageProps) {
  return <Play vis={<>
    <div className="pot-row">{t.values.map((water, i) => { const [lo, hi] = irrigationBands[i], ok = water >= lo && water <= hi; return <div key={i} className={`irrigation-bed ${ok ? 'ok' : ''}`}>
      <strong>{plantInfo[i].name}</strong>
      <Pot kind={i} water={water} band={irrigationBands[i]} />
      <div className="moisture-scale"><span className="band" style={{ left: `${lo}%`, width: `${hi - lo}%` }} /><span className="needle" style={{ left: `${water}%` }} /></div>
      <small>Moisture {water} · target {lo}–{hi}</small>
      <div className="stage-buttons"><Btn onClick={() => send('water', i, -10)}>↩ −10</Btn><Btn onClick={() => send('water', i, 10)}>💧 +10</Btn></div>
    </div>; })}</div>
</>} controls={<>
    <div className="stage-buttons"><Btn primary onClick={() => send('test')}>🔍 Inspect all root zones</Btn></div>
  </>} />;
}
