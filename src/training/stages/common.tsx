import { createContext, useContext, type ReactNode } from 'react';
import type { TaskState } from '../engine';

export interface StageProps {
  t: TaskState;
  send: (type: string, index?: number, value?: number) => void;
  running: boolean;
  setRunning: (running: boolean) => void;
}

export const Btn = ({ children, onClick, disabled = false, primary = false, className = '' }: { children: ReactNode; onClick: () => void; disabled?: boolean; primary?: boolean; className?: string }) =>
  <button type="button" className={`${primary ? 'stage-primary ' : ''}${className}`} disabled={disabled} onClick={onClick}>{children}</button>;

/** Horizontal fill bar with a big number. */
export function Meter({ label, value, unit = '', color = '#5fe08a', max = 100 }: { label: string; value: number; unit?: string; color?: string; max?: number }) {
  return <div className="stage-meter"><div><span>{label}</span><strong style={{ color }}>{Math.round(value)}{unit}</strong></div>
    <div className="meter-track"><span style={{ width: `${Math.max(0, Math.min(100, value / max * 100))}%`, background: color }} /></div></div>;
}

/** Gauge with coloured zones: [from, to, colour, label]. */
export function ZoneGauge({ label, value, zones, marker }: { label: string; value: number; zones: [number, number, string, string][]; marker?: { value: number; label: string } }) {
  const inside = zones.find(([a, b]) => value >= a && value <= b);
  return <div className="zone-gauge">
    <div className="zone-head"><span>{label}</span><strong style={{ color: inside?.[2] }}>{Math.round(value)} <small>{inside?.[3]}</small></strong></div>
    <div className="zone-track">
      {zones.map(([a, b, c, l]) => <span key={a} className="zone" style={{ left: `${a}%`, width: `${b - a}%`, background: c }}><small>{l}</small></span>)}
      {marker && <span className="zone-marker" style={{ left: `${Math.max(0, Math.min(100, marker.value))}%` }}><small>{marker.label}</small></span>}
      <span className="zone-needle" style={{ left: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  </div>;
}

/** Extra controls (feedback, hint, reset) the overlay injects into the controls pane. */
export const PlayExtra = createContext<ReactNode>(null);

/** Play layout: the illustrated scene on the left, every control on the right, both on screen at once. */
export function Play({ vis, controls }: { vis: ReactNode; controls: ReactNode }) {
  const extra = useContext(PlayExtra);
  return <div className="play"><div className="play-vis">{vis}</div><div className="play-controls">{controls}{extra}</div></div>;
}
