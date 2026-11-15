import { useEffect, useMemo, type ReactNode } from 'react';
import './celebrate.css';

/** Short, quiet sound cues made with Web Audio (no audio files). Silently does nothing if audio is unavailable. */
let audio: AudioContext | null = null;
export function playCue(kind: 'win' | 'fail' | 'mistake' | 'step') {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    audio ??= new Ctx();
    if (audio.state === 'suspended') void audio.resume();
    const notes = kind === 'win' ? [523, 659, 784, 1047] : kind === 'fail' ? [392, 330, 262] : kind === 'mistake' ? [220] : [660];
    const gap = kind === 'win' ? .11 : kind === 'fail' ? .2 : .08;
    notes.forEach((freq, i) => {
      const at = audio!.currentTime + i * gap, osc = audio!.createOscillator(), gain = audio!.createGain();
      osc.type = kind === 'mistake' || kind === 'fail' ? 'triangle' : 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(kind === 'mistake' ? .05 : .08, at + .02);
      gain.gain.exponentialRampToValueAtTime(.0001, at + (kind === 'win' && i === notes.length - 1 ? .7 : .28));
      osc.connect(gain).connect(audio!.destination);
      osc.start(at); osc.stop(at + .8);
    });
  } catch { /* audio is optional */ }
}

/** BIP, the friendly robot guide. */
export function Mascot({ mood }: { mood: 'happy' | 'sad' | 'thinking' }) {
  const happy = mood === 'happy', sad = mood === 'sad';
  return <svg viewBox="0 0 160 170" className={`mascot mascot-${mood}`} aria-hidden="true">
    <ellipse cx="80" cy="162" rx="44" ry="7" fill="#0006" className="mascot-shadow" />
    <g className="mascot-body">
      <path d="M80 18 V6" stroke="#9aa6b8" strokeWidth="4" /><circle cx="80" cy="6" r="6" fill={happy ? '#5fe08a' : sad ? '#ff8a6a' : '#f2d33c'} className="mascot-light" />
      <rect x="28" y="18" width="104" height="78" rx="30" fill="#e9edf3" stroke="#9aa6b8" strokeWidth="3" />
      <rect x="40" y="30" width="80" height="52" rx="22" fill="#16203a" />
      {happy ? <><path d="M56 58 q8 -12 16 0" stroke="#5fe08a" strokeWidth="5" fill="none" strokeLinecap="round" /><path d="M88 58 q8 -12 16 0" stroke="#5fe08a" strokeWidth="5" fill="none" strokeLinecap="round" /><path d="M66 68 q14 12 28 0" stroke="#5fe08a" strokeWidth="4" fill="none" strokeLinecap="round" /></>
        : sad ? <><path d="M56 52 l14 6 M104 52 l-14 6" stroke="#ff8a6a" strokeWidth="4" strokeLinecap="round" /><circle cx="64" cy="62" r="5" fill="#ff8a6a" /><circle cx="96" cy="62" r="5" fill="#ff8a6a" /><path d="M68 76 q12 -8 24 0" stroke="#ff8a6a" strokeWidth="4" fill="none" strokeLinecap="round" /><path d="M112 34 q5 9 0 13 q-5 -4 0 -13" fill="#7fc8ff" className="mascot-tear" /></>
        : <><circle cx="64" cy="56" r="6" fill="#f2d33c" /><circle cx="96" cy="56" r="6" fill="#f2d33c" /><path d="M70 72 h20" stroke="#f2d33c" strokeWidth="4" strokeLinecap="round" /></>}
      <rect x="44" y="96" width="72" height="50" rx="16" fill="#d9dee6" stroke="#9aa6b8" strokeWidth="3" />
      <circle cx="68" cy="116" r="5" fill="#e2412f" /><circle cx="80" cy="116" r="5" fill="#3cc27a" /><circle cx="92" cy="116" r="5" fill="#3a8fe0" />
      <g className="mascot-arm-l"><path d={happy ? 'M44 104 L20 76' : 'M44 106 L22 132'} stroke="#9aa6b8" strokeWidth="9" strokeLinecap="round" /><circle cx={happy ? 18 : 20} cy={happy ? 72 : 136} r="8" fill="#e9edf3" stroke="#9aa6b8" strokeWidth="3" /></g>
      <g className="mascot-arm-r"><path d={happy ? 'M116 104 L140 76' : sad ? 'M116 106 L138 132' : 'M116 104 L132 86 L112 70'} stroke="#9aa6b8" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" /><circle cx={happy ? 142 : sad ? 140 : 110} cy={happy ? 72 : sad ? 136 : 68} r="8" fill="#e9edf3" stroke="#9aa6b8" strokeWidth="3" /></g>
      <rect x="54" y="144" width="18" height="14" rx="5" fill="#9aa6b8" /><rect x="88" y="144" width="18" height="14" rx="5" fill="#9aa6b8" />
    </g>
  </svg>;
}

const confettiColors = ['#f2d33c', '#5fe08a', '#3d8bff', '#ff6a8a', '#b06cff', '#ff9a3a'];

/** A burst of confetti pieces that fall once. */
export function Confetti({ count = 46 }: { count?: number }) {
  const pieces = useMemo(() => Array.from({ length: count }, (_, i) => ({
    left: (i * 37 + 11) % 100, delay: (i % 12) * .05, duration: 1.8 + (i % 5) * .25, drift: ((i * 53) % 120) - 60,
    color: confettiColors[i % confettiColors.length], shape: i % 3, rotate: (i * 47) % 360
  })), [count]);
  return <div className="confetti" aria-hidden="true">{pieces.map((p, i) => <span key={i} className={`confetti-piece shape-${p.shape}`} style={{ left: `${p.left}%`, background: p.color, animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s`, '--drift': `${p.drift}px`, '--rot': `${p.rotate}deg` } as React.CSSProperties} />)}</div>;
}

const cheers = ['Fantastic work, astronaut!', 'Mission accomplished!', 'The colony is proud of you!', 'You did it! Mars is a little safer now.', 'Brilliant thinking, space explorer!'];

/** Big animated success header: confetti, happy BIP, stars popping in one by one. */
export function WinCelebration({ stars, title, children, sound = true }: { stars?: number; title: string; children?: ReactNode; sound?: boolean }) {
  const cheer = useMemo(() => cheers[Math.floor(Math.random() * cheers.length)], []);
  useEffect(() => { if (sound) playCue('win'); }, [sound]);
  return <div className="win-celebration">
    <Confetti />
    <div className="win-glow" aria-hidden="true" />
    <Mascot mood="happy" />
    <div className="win-text">
      <span className="win-kicker">{cheer}</span>
      <h3 className="win-title">{title}</h3>
      {stars !== undefined && <div className="win-stars" aria-label={`${stars} of 3 stars`}>{[0, 1, 2].map(i => <span key={i} className={i < stars ? 'win-star on' : 'win-star'} style={{ animationDelay: `${.35 + i * .28}s` }}>★</span>)}</div>}
      {stars !== undefined && <small className="win-stars-note">{stars === 3 ? 'Perfect: no mistakes!' : stars === 2 ? 'Great job! Try again for 3 stars.' : 'Completed! Practise to earn more stars.'}</small>}
      {children}
    </div>
  </div>;
}

/** Friendly failure header: sad BIP, shake, and an encouraging line before the lesson. */
export function FailHero({ title, children }: { title: string; children?: ReactNode }) {
  useEffect(() => { playCue('fail'); }, []);
  return <div className="fail-hero">
    <div className="fail-pulse" aria-hidden="true" />
    <Mascot mood="sad" />
    <div className="fail-text">
      <span className="fail-kicker">⚠ SYSTEM ISOLATED</span>
      <h3>{title}</h3>
      <p>Oh no! But don’t worry: every real astronaut makes mistakes in training. That is exactly how they learn. Let’s see what happened and how to fix it.</p>
      {children}
    </div>
  </div>;
}
