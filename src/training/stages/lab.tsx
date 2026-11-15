import { useState } from 'react';
import { Slider } from '../Slider';
import { useGame } from '../../store/game';
import { ANTENNA_PAUSE } from '../engine';
import type { StageProps } from './common';
import { Btn, Meter, Play } from './common';

const clock = (minutes: number) => `${String(Math.floor(minutes)).padStart(2, '0')}:${String(Math.floor((minutes % 1) * 60)).padStart(2, '0')}`;

/** Aim the dish, then watch the message travel to Earth and the reply come back (1 s here = 1 real minute). */
export function AntennaStage({ t, send, running, setRunning }: StageProps) {
  const delay = useGame(s => s.environment.commDelayMinutes);
  const a = t.values[0], error = Math.abs(a - 65), ok = error <= 5, strength = Math.max(0, Math.round(100 - error * 4));
  const sent = t.phase === 1, elapsed = t.values[1], d = sent ? t.values[2] : delay, P = ANTENNA_PAUSE;
  const stage = !sent ? 0 : elapsed < d ? 1 : elapsed < d + P ? 2 : elapsed < 2 * d + P ? 3 : 4;
  // Real radio time only counts while a signal is travelling; the pause on Earth is mission control writing.
  const realMinutes = Math.min(2 * d, elapsed < d ? elapsed : elapsed < d + P ? d : elapsed - P);
  const ox = 150, oy = 200, toXY = (deg: number, dist: number) => [ox + Math.cos(deg * Math.PI / 180) * dist, oy - Math.sin(deg * Math.PI / 180) * dist];
  const [ex, ey] = toXY(65, 165), dx = Math.cos(a * Math.PI / 180), dy = -Math.sin(a * Math.PI / 180);
  const out = Math.min(1, elapsed / d), back = Math.max(0, Math.min(1, (elapsed - d - P) / d));
  const px = stage === 1 ? 110 + out * 380 : 490 - back * 380;
  const total = 2 * d + P;
  return <Play vis={<>
    {!sent ? <svg viewBox="0 0 600 260" className="stage-svg" aria-label={`Antenna at ${a} degrees, Earth at 65 degrees`}>
      <defs><radialGradient id="earth-g" cx=".35" cy=".35"><stop offset="0" stopColor="#9fd0ff" /><stop offset="1" stopColor="#1f5fb8" /></radialGradient></defs>
      <rect width="600" height="260" fill="#070a18" rx="10" />
      {Array.from({ length: 40 }, (_, i) => <circle key={i} cx={(i * 149) % 600} cy={(i * 67) % 190} r={i % 4 ? .8 : 1.5} fill="#fff" opacity=".7" />)}
      <circle cx={ex} cy={ey} r="30" fill="#3d8bff" opacity=".15" /><circle cx={ex} cy={ey} r="13" fill="url(#earth-g)" />
      <text x={ex} y={ey + 34} textAnchor="middle" className="svg-label">EARTH · 65°</text>
      <path d={`M${ox} ${oy} L${ox + dx * 520 - dy * 40} ${oy + dy * 520 + dx * 40} L${ox + dx * 520 + dy * 40} ${oy + dy * 520 - dx * 40} Z`} fill={ok ? '#3cc27a' : '#f2a33c'} opacity=".18" />
      <path d={`M${ox} ${oy} L${ox + dx * 520} ${oy + dy * 520}`} stroke={ok ? '#3cc27a' : '#f2a33c'} strokeWidth="2" strokeDasharray="8 8" className="ray-flow" />
      <path d="M0 215 Q150 196 300 212 T600 206 V260 H0 Z" fill="#9a5236" />
      <path d={`M${ox} ${oy + 8} V240 M${ox - 25} 242 H${ox + 25}`} stroke="#a8b2c4" strokeWidth="7" strokeLinecap="round" />
      <g transform={`translate(${ox} ${oy}) rotate(${-a})`}>
        <path d="M-4 -46 Q-40 0 -4 46 Z" fill="#d9dee6" stroke="#8d99ab" strokeWidth="4" />
        <path d="M-20 0 H34" stroke="#f2d33c" strokeWidth="4" /><circle cx="34" cy="0" r="5" fill="#f2d33c" />
      </g>
      <path d={`M${ox + 60} ${oy} A60 60 0 0 0 ${ox + Math.cos(a * Math.PI / 180) * 60} ${oy - Math.sin(a * Math.PI / 180) * 60}`} stroke="#ffffff55" strokeWidth="2" fill="none" />
      <text x="300" y="252" textAnchor="middle" className="svg-label">ANTENNA {a}°</text>
    </svg>
    : <svg viewBox="0 0 600 320" className="stage-svg" aria-label="Radio message travelling between Mars and Earth">
      <defs>
        <radialGradient id="earth-j" cx=".35" cy=".35"><stop offset="0" stopColor="#9fd0ff" /><stop offset="1" stopColor="#1f5fb8" /></radialGradient>
        <radialGradient id="mars-j" cx=".35" cy=".35"><stop offset="0" stopColor="#f0a070" /><stop offset="1" stopColor="#a5452a" /></radialGradient>
        <radialGradient id="pulse-g"><stop offset="0" stopColor="#fff" /><stop offset=".4" stopColor={stage === 1 ? '#f2d33c' : '#5fd0ff'} /><stop offset="1" stopColor={stage === 1 ? '#f2d33c' : '#5fd0ff'} stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="600" height="320" fill="#05070f" rx="10" />
      {Array.from({ length: 60 }, (_, i) => <circle key={i} cx={(i * 149) % 600} cy={(i * 71) % 320} r={i % 5 ? .7 : 1.4} fill="#fff" opacity=".6" />)}
      <path d="M110 170 H490" stroke="#ffffff33" strokeWidth="2" strokeDasharray="6 8" />
      <circle cx="70" cy="170" r="40" fill="url(#mars-j)" /><text x="70" y="232" textAnchor="middle" className="svg-label">MARS · US</text>
      <circle cx="530" cy="170" r="34" fill="#3d8bff" opacity=".18" /><circle cx="530" cy="170" r="26" fill="url(#earth-j)" /><text x="530" y="232" textAnchor="middle" className="svg-label">EARTH</text>
      {stage < 4 && <text x="300" y="262" textAnchor="middle" className="chart-note">≈ {Math.round(d * 18)} million km · radio travels at 300 000 km/s</text>}
      {(stage === 1 || stage === 3) && <g transform={`translate(${px} 170)`}>
        <circle r="22" fill="url(#pulse-g)" className="pulse" />
        {[10, 18, 26].map(r => <path key={r} d={stage === 1 ? `M${-r * .3} ${-r} A${r} ${r} 0 0 1 ${-r * .3} ${r}` : `M${r * .3} ${-r} A${r} ${r} 0 0 0 ${r * .3} ${r}`} stroke={stage === 1 ? '#f2d33c' : '#5fd0ff'} strokeWidth="2" fill="none" opacity=".7" />)}
        <text y="-30" textAnchor="middle" fontSize="18">{stage === 1 ? '📨' : '📩'}</text>
      </g>}
      <g transform="translate(70 34)">
        <rect x="-60" y="0" width="240" height="58" rx="12" fill="#2a1e30" stroke="#f2d33c" strokeWidth="2" /><path d="M-10 58 l10 16 l10 -16" fill="#2a1e30" stroke="#f2d33c" strokeWidth="2" />
        <text x="-48" y="22" className="bubble-title">ARES ONE · SENT</text><text x="-48" y="44" className="bubble-text">“We have arrived on Mars!”</text>
      </g>
      {stage >= 2 && <g transform="translate(530 34)"><g className="bubble-pop">
        <rect x="-180" y="0" width="240" height="58" rx="12" fill="#10243a" stroke="#5fd0ff" strokeWidth="2" /><path d="M-10 58 l10 16 l10 -16" fill="#10243a" stroke="#5fd0ff" strokeWidth="2" />
        <text x="-168" y="22" className="bubble-title">EARTH · {stage === 2 ? 'WRITING A REPLY…' : 'REPLY SENT'}</text><text x="-168" y="44" className="bubble-text">“Welcome to Mars, Ares One!”</text>
      </g></g>}
      {stage >= 4 && <g transform="translate(70 252)"><g className="bubble-pop">
        <rect x="-60" y="0" width="270" height="52" rx="12" fill="#12301f" stroke="#5fe08a" strokeWidth="2" />
        <text x="-48" y="22" className="bubble-title">📩 REPLY RECEIVED ON MARS</text><text x="-48" y="42" className="bubble-text">{clock(2 * d)} min after we sent it!</text>
      </g></g>}
      {stage < 4 && <g transform="translate(110 292)">
        <rect width="380" height="10" rx="5" fill="#1c2740" />
        <rect width={380 * d / total} height="10" rx="5" fill="#f2d33c66" /><rect x={380 * (d + P) / total} width={380 * d / total} height="10" rx="5" fill="#5fd0ff66" />
        <circle cx={380 * Math.min(1, elapsed / total)} cy="5" r="8" fill="#fff" />
        <text x="0" y="-8" className="chart-axis">→ TO EARTH</text><text x="380" y="-8" textAnchor="end" className="chart-axis">BACK TO MARS ←</text>
      </g>}
    </svg>}
  </>} controls={<>
    {!sent ? <>
      <Slider label="Antenna angle" value={a} max={90} onChange={value => send('angle', undefined, value)} />
      <Meter label="📶 Signal strength" value={strength} unit="%" color={ok ? '#5fe08a' : strength > 50 ? '#f2a33c' : '#e2573b'} />
      <div className="delay-card"><b>⏳ TODAY’S DISTANCE</b><p>Earth is about <strong>{Math.round(delay * 18)} million km</strong> away. A radio message needs <strong>{delay} minutes</strong> to get there, and the answer needs {delay} more.</p></div>
      <div className="stage-buttons"><Btn primary onClick={() => { send('send', undefined, delay); setRunning(true); }}>📡 Send “We have arrived!”</Btn></div>
    </> : <>
      <div className="radio-clock">
        <span>REAL RADIO TIME</span><strong>{clock(realMinutes)}</strong><small>of {clock(2 * d)} min there and back</small>
        <em>In this game: {Math.floor(elapsed)} s · 1 second = 1 real minute</em>
      </div>
      <ol className="step-track">{([['📡 Message flies to Earth', `${d} min`, stage > 1], ['🌍 Earth writes a reply', '', stage > 2], ['📩 Reply flies back to Mars', `${d} min`, stage > 3]] as [string, string, boolean][]).map(([label, time, done], i) => <li key={label} className={done ? 'ok' : stage === i + 1 ? 'now' : ''}><b>{done ? '✓' : i + 1}</b>{label}<small>{time}</small></li>)}</ol>
      <div className="delay-compare">
        <div><span>📱 Phone call on Earth</span><b>less than 1 second</b></div>
        <div><span>🔴 Mars ↔ Earth today</span><b>{2 * d} min there and back</b></div>
        <small>Mars and Earth orbit the Sun at different speeds, so the delay changes from about 3 to 22 minutes one way. A live chat is impossible!</small>
      </div>
      {!running && stage < 4 && <div className="stage-buttons"><Btn primary onClick={() => setRunning(true)}>▶ Continue the transmission</Btn></div>}
    </>}
  </>} />;
}

/** Procedural rock textures in a 200×200 box: 0 vesicular basalt, 1 layered sediment, 2 crystals. */
function RockTexture({ kind }: { kind: number }) {
  return <>
    {kind === 0 && <><rect width="200" height="200" fill="#4a4550" />{Array.from({ length: 22 }, (_, i) => <ellipse key={i} cx={(i * 47) % 190 + 6} cy={(i * 71) % 190 + 6} rx={6 + i % 4 * 3} ry={5 + i % 3 * 2} fill="#1c1a22" stroke="#7a7280" strokeWidth="1.5" />)}</>}
    {kind === 1 && <>{Array.from({ length: 12 }, (_, i) => <path key={i} d={`M0 ${i * 18} Q60 ${i * 18 - 8} 120 ${i * 18 + 4} T200 ${i * 18} V${i * 18 + 20} H0 Z`} fill={['#c9a27a', '#a97e58', '#dcb98e', '#8e6a4a'][i % 4]} />)}</>}
    {kind === 2 && <><rect width="200" height="200" fill="#5a5068" />{Array.from({ length: 14 }, (_, i) => { const x = (i * 53) % 180 + 10, y = (i * 37) % 180 + 10; return <g key={i}><path d={`M${x} ${y} l14 -10 l14 10 l-4 22 l-20 4 Z`} fill={['#c8c0e0', '#e8e0f6', '#9a8fc0'][i % 3]} stroke="#fff" strokeWidth="1" /><path d={`M${x} ${y} l14 4 l14 -4 M${x + 14} ${y + 4} l-4 22`} stroke="#ffffff88" strokeWidth="1" fill="none" /></g>; })}</>}
  </>;
}

const features = [['Round holes', 'Gas bubbles in cooled lava'], ['Layers', 'Sediment laid down over time'], ['Crystals', 'Minerals that grew slowly']];

export function RockStage({ t, send }: StageProps) {
  const focus = t.values[0], blur = Math.abs(focus - 65) / 10, sharp = Math.abs(focus - 65) <= 8, sample = Math.min(2, t.phase);
  return <Play vis={<>
    <div className="microscope-view">
        <svg viewBox="0 0 240 240" role="img" aria-label={`Sample ${sample + 1}, ${sharp ? 'in focus' : 'blurred'}`}>
          <defs><clipPath id="lens"><circle cx="120" cy="120" r="100" /></clipPath><radialGradient id="vignette"><stop offset=".7" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".8" /></radialGradient></defs>
          <rect width="240" height="240" fill="#05070d" />
          <g clipPath="url(#lens)"><g transform="translate(20 20)" style={{ filter: `blur(${blur}px)` }}><RockTexture kind={sample} /></g><circle cx="120" cy="120" r="100" fill="url(#vignette)" /></g>
          <circle cx="120" cy="120" r="104" fill="none" stroke={sharp ? '#3cc27a' : '#8d99ab'} strokeWidth="8" />
          <path d="M120 30 V50 M120 190 V210 M30 120 H50 M190 120 H210" stroke="#ffffff55" strokeWidth="2" />
        </svg>
        <span className={sharp ? 'ok-label' : 'warn-label'}>{sharp ? '● IN FOCUS' : '○ BLURRED · turn the focus'}</span>
      </div>
</>} controls={<>
      <div className="rock-side">
        <strong className="side-title">SAMPLE {sample + 1} / 3 · what do you see?</strong>
        <div className="sample-dots">{[0, 1, 2].map(i => <i key={i} className={i < t.phase ? 'done' : i === t.phase ? 'now' : ''} />)}</div>
        {features.map(([label, note], i) => <button type="button" key={label} className="feature-card" onClick={() => send('identify', i)}>
          <svg viewBox="0 0 200 200" aria-hidden="true"><RockTexture kind={i} /></svg>
          <span><b>{label}</b><small>{note}</small></span>
        </button>)}
      </div>
    <Slider label="Microscope focus" value={focus} onChange={value => send('focus', undefined, value)} />
  </>} />;
}

const sensors = [['🌡️', 'Thermometer', 'Temperature'], ['⏲️', 'Barometer', 'Pressure'], ['🌬️', 'Wind vane', 'Wind'], ['🔆', 'Optical sensor', 'Light / dust']];

export function WeatherStage({ t, send }: StageProps) {
  const calibration=t.hard&&t.phase===1,displaySensors=calibration?[['❄️','Cooling reference','Temperature'],['⏲️','Pressure reference','Pressure'],['🌬️','Spinning vane check','Wind'],['🔆','Reference lamp','Light / dust']]:sensors;
  const [selected, setSelected] = useState(-1), m = t.marks;
  return <Play vis={<>
    <svg viewBox="0 0 220 380" className="stage-svg mast-svg" aria-label="Weather mast">
        <rect width="220" height="380" fill="#1b1424" rx="10" />
        <path d="M0 340 Q110 320 220 338 V380 H0 Z" fill="#9a5236" />
        <rect x="104" y="30" width="12" height="320" fill="#a8b2c4" />
        {[0, 1, 2, 3].map(i => { const y = 60 + i * 72, mounted = m.includes(i); return <g key={i}>
          <path d={`M116 ${y} H170`} stroke="#a8b2c4" strokeWidth="5" />
          <circle cx="180" cy={y} r="22" fill={mounted ? '#163a2b' : '#0d1828'} stroke={mounted ? '#3cc27a' : '#56647e'} strokeWidth="3" strokeDasharray={mounted ? '' : '5 4'} />
          <text x="180" y={y + 8} textAnchor="middle" fontSize="22">{mounted ? displaySensors[i][0] : ''}</text>
          <text x="96" y={y + 4} textAnchor="end" className="svg-label">{displaySensors[i][2].toUpperCase()}</text>
        </g>; })}
      </svg>
</>} controls={<>
      <div className="weather-side">
        <strong className="side-title">1 · CHOOSE A SENSOR</strong>
        {t.hard&&<p className="hard-stage-rules">{calibration?'Round 2/2: match the independent calibration checks.':'Round 1/2: connect all four sensors, then verify four calibration checks.'} A wrong connection trips the bus.</p>}<div className="sensor-cards">{displaySensors.map(([icon, name], i) => <button type="button" key={name} disabled={m.includes(i)} aria-pressed={selected === i} className={selected === i ? 'selected' : ''} onClick={() => setSelected(i)}><span>{icon}</span>{m.includes(i) ? '✓ ' : ''}{name}</button>)}</div>
        <strong className="side-title">2 · CHOOSE ITS SOCKET</strong>
        <div className="sensor-cards sockets">{displaySensors.map(([, , quantity], i) => <button type="button" key={quantity} disabled={selected < 0 || m.includes(i)} onClick={() => { send('match', selected, i); setSelected(-1); }}>⭘ {quantity} socket</button>)}</div>
      </div>
  </>} />;
}
