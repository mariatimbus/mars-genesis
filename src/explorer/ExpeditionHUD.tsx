import { useExplorer } from './store';
import { formatDistance } from './planet';

export function ExpeditionHUD(){
 const rover=useExplorer(s=>s.rovers.find(r=>r.id===s.activeRover));
 if(!rover)return null;
 return <section className="rover-dashboard" aria-label="Rover driving status"><span className="fps-eyebrow">{rover.name.toUpperCase()} · CABIN</span><div><strong>{Math.round(Math.abs(rover.speed)*3.6)}<small>KM/H</small></strong><span>{rover.battery.toFixed(0)}%<small>BATTERY</small></span><span>{formatDistance(rover.odometer)}<small>ODOMETER</small></span></div></section>;
}
