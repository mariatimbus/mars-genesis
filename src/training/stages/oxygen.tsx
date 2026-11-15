import { useState } from 'react';
import { Slider } from '../Slider';
import { airDemand, crewActivity } from '../engine';
import { Astronaut } from '../art';
import type { StageProps } from './common';
import { Btn, ZoneGauge, Play } from './common';

export function FillStage({ t, send }: StageProps) {
  const level = t.values[0], over = level > 60, reserve = 100 - level;
  return <Play vis={<>
    <svg viewBox="0 0 600 290" className="stage-svg" aria-label={`Electrolysis cell at ${level} of 100`}>
      <defs><linearGradient id="fill-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6fc3ff" /><stop offset="1" stopColor="#1e6fc2" /></linearGradient></defs>
      <rect width="600" height="290" fill="#0d1828" rx="10" />
      {/* shared reserve */}
      <text x="110" y="26" textAnchor="middle" className="svg-label">SHARED WATER RESERVE</text>
      <rect x="40" y="36" width="140" height="200" rx="14" fill="#132238" stroke="#8d99ab" strokeWidth="5" />
      <rect x="47" y={229 - reserve * 1.86} width="126" height={reserve * 1.86} rx="8" fill="url(#fill-water)" />
      <text x="110" y="140" textAnchor="middle" className="temp-big">{reserve}</text>
      {[['🥤', 'DRINKING', 60], ['🌱', 'PLANTS', 120], ['🫧', 'O₂ CELL', 180]].map(([icon, label, y]) => <g key={label as string}>
        <path d={`M180 ${y} H${label === 'O₂ CELL' ? 330 : 240}`} stroke="#8d99ab" strokeWidth="6" />
        {label !== 'O₂ CELL' && <><text x="262" y={(y as number) + 7} fontSize="22">{icon}</text><text x="292" y={(y as number) + 5} className="svg-label">{label}</text></>}
      </g>)}
      <text x="110" y="262" textAnchor="middle" className={reserve < 40 ? 'warn-label' : 'svg-label'}>{reserve < 40 ? '⚠ TOO LITTLE LEFT' : 'SHARED: CREW · PLANTS · O₂'}</text>
      {/* electrolysis cell */}
      <text x="440" y="26" textAnchor="middle" className="svg-label">ELECTROLYSIS CELL</text>
      <path d="M330 180 H360" stroke="#8d99ab" strokeWidth="6" />
      <rect x="360" y="40" width="160" height="210" rx="10" fill="#132238" stroke={over ? '#e2573b' : '#8d99ab'} strokeWidth="5" />
      <rect x="366" y={244 - level * 1.98} width="148" height={level * 1.98} rx="5" fill={over ? '#e2573b88' : 'url(#fill-water)'} className="fill-level" />
      {Array.from({ length: 11 }, (_, i) => <g key={i}><path d={`M520 ${244 - i * 19.8} h${i % 5 ? 8 : 16}`} stroke="#8d99ab" strokeWidth="2" /><text x="544" y={248 - i * 19.8} className="chart-axis">{i % 2 ? '' : i * 10}</text></g>)}
      <path d={`M352 ${244 - 60 * 1.98} H528`} stroke="#3cc27a" strokeWidth="4" strokeDasharray="10 5" />
      <text x="440" y={238 - 60 * 1.98} textAnchor="middle" className="ok-label">FILL LINE 60</text>
      <rect x="400" y="140" width="10" height="96" fill="#5a6272" /><rect x="470" y="140" width="10" height="96" fill="#5a6272" />
      <text x="440" y="278" textAnchor="middle" className={over ? 'warn-label' : 'svg-label'}>{level} / 100 {over ? '· OVERFILLED!' : level === 60 ? '· PERFECT ✓' : ''}</text>
    </svg>
</>} controls={<>
    <div className="stage-buttons"><Btn onClick={() => send('pour')}>💧 Pour +10</Btn><Btn onClick={() => send('drain')}>↩ Drain −10</Btn><Btn primary onClick={() => send('connect')}>🔌 Connect the cell</Btn></div>
  </>} />;
}

function Molecule({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle cx="-22" cy="16" r="13" fill="#f4f6fa" stroke="#9aa6b8" strokeWidth="2" /><circle cx="22" cy="16" r="13" fill="#f4f6fa" stroke="#9aa6b8" strokeWidth="2" />
    <circle r="22" fill="#e2412f" stroke="#ff9a8a" strokeWidth="2" /><text y="6" textAnchor="middle" fontSize="16" fill="#fff" fontWeight="700">O</text>
    <text x="-22" y="21" textAnchor="middle" fontSize="12" fill="#333" fontWeight="700">H</text><text x="22" y="21" textAnchor="middle" fontSize="12" fill="#333" fontWeight="700">H</text>
  </g>;
}

export function SplitStage({ t, send }: StageProps) {
  const [selected, setSelected] = useState(-1), m = t.marks, v = t.values, phase = t.phase;
  const atom = (i: number) => i % 3 === 0 ? 'O' : 'H';
  return <Play vis={<>
    <svg viewBox="0 0 600 270" className="stage-svg" aria-label="Electrolysis apparatus">
      <rect width="600" height="270" fill="#0d1828" rx="10" />
      <g transform="translate(300 34)"><rect x="-50" y="-18" width="100" height="36" rx="6" fill={phase >= 2 ? '#f2c230' : '#5a6272'} stroke="#8d99ab" strokeWidth="3" /><text y="7" textAnchor="middle" fontWeight="700" fill="#1a1a1a">⚡ {phase >= 2 ? 'ON' : 'OFF'}</text>
        <text x="-62" y="6" textAnchor="end" fontSize="20" fill="#9fe8ff">−</text><text x="62" y="6" fontSize="20" fill="#ff9a8a">+</text></g>
      <path d="M250 34 H180 V110" stroke={phase >= 2 ? '#f2c230' : '#5a6272'} strokeWidth="4" fill="none" className={phase >= 2 ? 'wire-live' : ''} />
      <path d="M350 34 H420 V110" stroke={phase >= 2 ? '#f2c230' : '#5a6272'} strokeWidth="4" fill="none" className={phase >= 2 ? 'wire-live' : ''} />
      <path d="M130 90 V250 H470 V90" fill="#132238" stroke="#8d99ab" strokeWidth="5" />
      <rect x="135" y="120" width="330" height="126" fill="#1e6fc2" opacity=".55" />
      <rect x="172" y="100" width="16" height="130" fill="#9aa6b8" /><rect x="412" y="100" width="16" height="130" fill="#9aa6b8" />
      <text x="180" y="262" textAnchor="middle" className="svg-label">− CATHODE: H₂</text><text x="420" y="262" textAnchor="middle" className="svg-label">+ ANODE: O₂</text>
      {phase === 0 && <><Molecule x={50} y={140} s={.8} /><Molecule x={50} y={210} s={.8} /><text x="50" y="100" textAnchor="middle" className="svg-label">2 × H₂O</text></>}
      {phase === 1 && <><Molecule x={270} y={170} /><Molecule x={340} y={200} /></>}
      {phase >= 2 && <>{Array.from({ length: 8 }, (_, i) => <circle key={`h${i}`} cx={170 + (i % 3) * 8} cy={220} r={3 + i % 2} fill="none" stroke="#e8f4ff" strokeWidth="2" className="bubble" style={{ animationDelay: `${i * .25}s` }} />)}
        {Array.from({ length: 4 }, (_, i) => <circle key={`o${i}`} cx={414 + (i % 2) * 8} cy={220} r={4 + i % 2} fill="none" stroke="#ffb0a0" strokeWidth="2" className="bubble" style={{ animationDelay: `${i * .5}s` }} />)}
        <text x="300" y="150" textAnchor="middle" className="ok-label">Molecules split! Sort the atoms ↓</text>
        <text x="300" y="175" textAnchor="middle" className="svg-label">Twice as many bubbles at the H₂ side</text></>}
    </svg>
</>} controls={<>
    {phase < 2 ? <div className="stage-buttons"><Btn disabled={phase !== 0} onClick={() => send('load')}>💧 Move 2 H₂O into the cell</Btn><Btn primary disabled={phase !== 1} onClick={() => send('current')}>⚡ Switch on the current</Btn></div>
      : <div className="atom-sorting">
        <div className="atom-tray">{[0, 1, 2, 3, 4, 5].map(i => <button type="button" key={i} aria-label={`Select ${atom(i) === 'O' ? 'oxygen' : 'hydrogen'} atom ${i + 1}`} disabled={m.includes(i)} className={`atom-ball ${atom(i) === 'O' ? 'oxygen' : 'hydrogen'} ${selected === i ? 'selected' : ''}`} onClick={() => setSelected(i)}>{m.includes(i) ? '✓' : atom(i)}</button>)}</div>
        <div className="tank-row">{[['H₂ HYDROGEN TANK', 0, 4, '#e8f4ff'], ['O₂ OXYGEN TANK', 1, 2, '#ff8a7a']].map(([label, k, need, color]) => <button type="button" key={label as string} className="gas-tank" disabled={selected < 0} onClick={() => { send('sort', selected, k as number); setSelected(-1); }}>
          <svg viewBox="0 0 90 120" aria-hidden="true"><rect x="10" y="12" width="70" height="100" rx="30" fill="#132238" stroke="#8d99ab" strokeWidth="4" /><rect x="35" y="2" width="20" height="12" fill="#8d99ab" />
            {Array.from({ length: v[k as number] }, (_, i) => <circle key={i} cx={34 + (i % 2) * 22} cy={92 - Math.floor(i / 2) * 22} r={k ? 10 : 7} fill={color as string} />)}</svg>
          <span><b>{label as string}</b><small>{v[k as number]} / {need as number} atoms · {Math.floor(v[k as number] / 2)} molecule{Math.floor(v[k as number] / 2) === 1 ? '' : 's'}</small></span>
        </button>)}</div>
      </div>}
    <div className="equation"><span className={phase >= 1 ? 'lit' : ''}>2 H₂O</span><b>→</b><span className={v[0] === 4 ? 'lit' : ''}>2 H₂</span><b>+</b><span className={v[1] === 2 ? 'lit' : ''}>O₂</span></div>
  </>} />;
}

const activityIcon: Record<string, string> = { Sleeping: '😴', Working: '🛠️', Exercising: '🏃' };

export function AirStage({ t, send, running, setRunning }: StageProps) {
  const v = t.values, demand = airDemand(t.time), activity = crewActivity(t.time), level = v[0], low = level < 30, high = level > 80;
  return <Play vis={<>
    <svg viewBox="0 0 600 250" className={`stage-svg ${low ? 'tint-low' : high ? 'tint-high' : ''}`} aria-label="Habitat air">
      <defs><radialGradient id="hab-air"><stop offset="0" stopColor={low ? '#5a2a3a' : high ? '#6a4a1a' : '#1f4a5a'} /><stop offset="1" stopColor="#0d1828" /></radialGradient></defs>
      <rect width="600" height="250" fill="#0d1828" rx="10" />
      <path d="M150 230 Q150 40 360 40 Q570 40 570 230 Z" fill="url(#hab-air)" stroke="#8d99ab" strokeWidth="6" />
      {Array.from({ length: Math.round(level / 6) }, (_, i) => <circle key={i} cx={200 + (i * 53) % 330} cy={80 + (i * 37) % 120} r="6" fill="none" stroke="#9fe8ff" strokeWidth="2" opacity=".7" className="o2-float" style={{ animationDelay: `${i * .3}s` }} />)}
      {[0, 1, 2].map(i => <g key={i} transform={`translate(${250 + i * 90} 132) scale(.62)`}><Astronaut suit={['#e9edf3', '#f2d9a0', '#cfe3f6'][i]} /></g>)}
      <text x="360" y="72" textAnchor="middle" fontSize="26">{activityIcon[activity]}</text>
      <text x="360" y="246" textAnchor="middle" className="svg-label">CREW: {activity.toUpperCase()} · USING {demand}</text>
      {high && <text x="530" y="110" fontSize="32" className="pulse">🔥</text>}
      {low && <text x="530" y="110" fontSize="32" className="pulse">😵</text>}
      <g transform="translate(40 60)"><rect width="70" height="150" rx="30" fill="#4f8fd8" stroke="#cfe0f6" strokeWidth="4" /><text x="35" y="84" textAnchor="middle" fontSize="22" fill="#fff" fontWeight="700">O₂</text></g>
      <path d="M110 150 H150" stroke="#8d99ab" strokeWidth="10" />
      <g transform={`translate(130 150) rotate(${v[1] * 2.7})`}><circle r="16" fill="none" stroke="#e2573b" strokeWidth="5" /><path d="M-16 0 H16 M0 -16 V16" stroke="#e2573b" strokeWidth="4" /></g>
      {v[1] > 0 && Array.from({ length: Math.max(1, Math.round(v[1] / 20)) }, (_, i) => <circle key={i} cx="160" cy="150" r="4" fill="#9fe8ff" className="flow-in" style={{ animationDelay: `${i * .25}s` }} />)}
      <text x="75" y="230" textAnchor="middle" className="svg-label">VALVE {v[1]}</text>
    </svg>
</>} controls={<>
    <ZoneGauge label="Habitat air balance" value={level} zones={[[0, 30, '#e2573b', 'Too little O₂'], [30, 80, '#3cc27a', 'Safe'], [80, 100, '#f2a33c', 'Fire risk']]} />
    <ZoneGauge label="Valve supply vs crew demand" value={v[1]} zones={[[0, 100, '#2a3a55', '']]} marker={{ value: demand, label: `crew needs ${demand}` }} />
    <Slider label="Oxygen valve" value={v[1]} onChange={value => send('valve', undefined, value)} />
    <div className="stage-readouts"><div className="progress-ring" style={{ '--p': `${Math.min(30, v[2]) / 30 * 100}%` } as React.CSSProperties}><strong>{Math.min(30, v[2]).toFixed(0)}</strong><small>/ 30 s</small></div>
      <Btn primary onClick={() => setRunning(!running)}>{running ? '⏸ Pause regulator' : '▶ Start regulator'}</Btn></div>
  </>} />;
}
