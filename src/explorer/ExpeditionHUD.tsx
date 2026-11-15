import { useExplorer } from './store';
import { LANDMARKS,canonicalPosition,surfaceDistance,surfaceBearing,formatDistance } from './planet';
import type { Layout } from './layout';

export function ExpeditionHUD({layout:l}:{layout:Layout}){
 const e=useExplorer(),rover=e.rovers.find(r=>r.id===e.activeRover),target=e.waypoint==='base'?{name:'Ares One',x:l.habitat.x*3,z:l.habitat.z*3}:LANDMARKS.find(s=>s.id===e.waypoint),geo=canonicalPosition(e.position[0],e.position[2]);
 return <>
  <div className="planet-navigation"><span className="fps-eyebrow">{rover?'ROVER EXPEDITION':'SURFACE EXPLORATION'}</span><strong>{target&&<span className="waypoint-bearing" style={{transform:`rotate(${(surfaceBearing({x:e.position[0],z:e.position[2]},target)-e.heading)*180/Math.PI}deg)`}}>↑</span>}{target?.name??'Free exploration'} <em>{target?formatDistance(surfaceDistance({x:e.position[0],z:e.position[2]},target)):''}</em></strong><small>{geo.latitude.toFixed(2)}° / {geo.longitude.toFixed(2)}°</small></div>
  {rover&&<section className="rover-dashboard" aria-label="Rover driving status"><span className="fps-eyebrow">{rover.name.toUpperCase()} / PRESSURIZED CABIN</span><div><strong>{Math.round(Math.abs(rover.speed)*3.6)}<small>KM/H</small></strong><span>{rover.battery.toFixed(0)}%<small>BATTERY</small></span><span>{formatDistance(rover.odometer)}<small>ODOMETER</small></span></div><p>W/S drive & reverse · A/D steer<br/>Shift boost · Space brake · E exit</p><small>Stop near Ares One or an outpost to charge.</small></section>}
 </>;
}
