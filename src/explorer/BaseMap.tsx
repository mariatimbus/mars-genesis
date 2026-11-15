import { useCrewLife } from '../characters/crewStore';
import { useId, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGame } from '../store/game';
import { exteriorPlan } from './exteriorPlan';
import { LANDMARKS } from './planet';
import { Maximize2, Minimize2, Tablet,Wrench } from 'lucide-react';
import { CELL, doorIsOpen, inAirlock, roomAt, type Layout } from './layout';
import { useExplorer } from './store';
import { makeFixtures } from './fixtures';
import { mapContains, mapEdge, tacticalFloor, tacticalView } from './tacticalMap';
import type { Kind } from '../simulation/engine';
import { roomMaintenance } from '../weather/alertState';
import { taskById } from '../training/catalog';
import { useTrainingUI } from '../training/ui';
import './tacticalMap.css';

export const ROOM_COLORS:Record<Kind,string>={habitat:'#bcc2dd',greenhouse:'#79bc84',research:'#728cdb',oxygen:'#8bd6c2',solar:'#d4c54d',water:'#698ec5',medical:'#b4809c',storage:'#8c8ea6'};
const codes:Record<Kind,string>={habitat:'HAB',greenhouse:'BIO',research:'LAB',oxygen:'O₂',solar:'PWR',water:'H₂O',medical:'MED',storage:'SUP'};
export function BaseMap({layout:l}:{layout:Layout}){
 const crewPositions=useCrewLife(s=>s.members),crew=useGame(s=>s.astronauts),buildings=useGame(s=>s.buildings);
 const commissioning=useGame(s=>s.commissioning);
 const maintenance=useMemo(()=>new Map(l.rooms.map(r=>[r.id,roomMaintenance({commissioning},r.kind)])),[l,commissioning]);
 const blocked=l.rooms.filter(r=>maintenance.get(r.id)?.blocked);
 const {position,heading,mapExpanded,rovers,doors,playerId}=useExplorer(useShallow(s=>({position:s.position,heading:s.heading,mapExpanded:s.mapExpanded,rovers:s.rovers,doors:s.doors,playerId:s.playerId})));
 const plan=useMemo(()=>exteriorPlan(l,buildings),[l,buildings]),floor=useMemo(()=>tacticalFloor(l),[l]),fixtures=useMemo(()=>makeFixtures(l),[l]);
 const view=useMemo(()=>tacticalView(l,plan.sites,position,mapExpanded),[l,plan.sites,position,mapExpanded]),u=view.unit,cone=useId().replaceAll(':','');
 const current=roomAt(l,position),location=inAirlock(l,position)?'AIRLOCK':current?.name??(view.following?'PLANET SURFACE':'EXTERIOR'),distance=Math.hypot(position[0]-l.airlock.x,position[2]-l.airlock.outerZ);
 const base={x:l.habitat.x*CELL,z:l.habitat.z*CELL},edge=mapEdge(view,base.x,base.z);
 const toggle=()=>useExplorer.setState(s=>({mapExpanded:!s.mapExpanded}));
 return <aside className={`base-map tactical-map ${mapExpanded?'base-map-expanded':''}`} aria-label="Tactical base map">
  <header><span>ARES ONE <small>TACTICAL</small></span><div className="base-map-controls"><button aria-label="Open astronaut tablet" onClick={()=>useExplorer.getState().open({type:'tablet'})}><Tablet size={13}/></button><button aria-label={mapExpanded?'Minimize map':'Expand map'} onClick={toggle}>{mapExpanded?<Minimize2 size={13}/>:<Maximize2 size={13}/>}<span>M</span></button></div></header>
  <div className="base-map-plot"><span className="base-map-north">N <i>↑</i></span>
   <svg viewBox={`${view.x} ${view.z} ${view.size} ${view.size}`} role={blocked.length?'group':'img'} aria-label="Tactical floor plan with rooms, corridors, doors, crew, rovers and your viewing direction">
    <defs><radialGradient id={cone}><stop offset="0" stopColor="#aeffeb" stopOpacity=".3"/><stop offset="1" stopColor="#aeffeb" stopOpacity="0"/></radialGradient></defs>
    <g className="map-exterior">
     {plan.routes.map(route=><polyline key={route.id} points={route.points.map(p=>`${p[0]},${p[2]}`).join(' ')} fill="none" stroke="#8ab7a7" strokeWidth={u*.8} strokeDasharray={`${u*2.5} ${u*3.5}`} opacity=".65"/>)}
     {plan.sites.map(site=><g key={site.id}><rect x={site.x-site.width/2} y={site.z-site.depth/2} width={site.width} height={site.depth} fill="#4f5a59" fillOpacity=".35" stroke="#b9c3ba" strokeWidth={u*.8}/><text x={site.x} y={site.z+u*2} textAnchor="middle" fill="#d1d9d0" fontSize={u*6.5} fontFamily="Inter,Segoe UI,sans-serif">{site.kind==='landing'?'PAD':site.kind==='comms'?'COM':site.kind.toUpperCase()}</text></g>)}
    </g>
    <path d={floor.floor} fill="#8d9696" stroke="#1c2526" strokeWidth={u*2.2} strokeLinejoin="miter"/>
    {/* Cover the internal tile seams; walls are drawn only at the footprint perimeter. */}
    <path d={floor.floor} fill="#8d9696"/>
    {l.rooms.map(r=>{const lock=maintenance.get(r.id)!;return <rect key={r.id} x={(r.x-r.radius-.5)*CELL+.7} y={(r.z-r.radius-.5)*CELL+.7} width={(r.radius*2+1)*CELL-1.4} height={(r.radius*2+1)*CELL-1.4} fill={lock.blocked?lock.direct?'#8b292b':'#694333':'#596362'} stroke={lock.blocked?lock.direct?'#ff7966':'#e5b171':'#aab2ae'} strokeWidth={u*(lock.blocked?1.2:.45)}/>})}
    {fixtures.filter(f=>f.type!=='terminal'&&f.type!=='suit').map(f=><rect key={f.id} x={f.x-f.width/2} y={f.z-f.depth/2} width={f.width} height={f.depth} fill="#293332" stroke="#b9c1b8" strokeOpacity=".5" strokeWidth={u*.35}/>)}
    <path d={floor.walls} fill="none" stroke="#d4d8cf" strokeWidth={u*1.15} strokeLinecap="square"/>
    {l.doors.map(d=><g key={d.id}><line x1={d.x-(d.axis==='z'?1.1:0)} y1={d.z-(d.axis==='x'?1.1:0)} x2={d.x+(d.axis==='z'?1.1:0)} y2={d.z+(d.axis==='x'?1.1:0)} stroke={doorIsOpen(d,doors)?'#9de3cb':d.airlock?'#dfb965':'#d8d9d0'} strokeWidth={u*(doorIsOpen(d,doors)?.65:1.8)}/></g>)}
    {l.rooms.map(r=><text className="tactical-room-code" key={r.id} x={r.x*CELL} y={r.z*CELL+u*(maintenance.get(r.id)?.blocked?8:2)} textAnchor="middle" fill={current?.id===r.id?'#f0fff4':'#d8dfd7'} fontSize={u*(r.kind==='habitat'||r.kind==='greenhouse'?8:6.5)} fontFamily="Inter,Segoe UI,sans-serif" fontWeight="700" stroke="#1c2725" strokeWidth={u*1.1} paintOrder="stroke">{codes[r.kind]}</text>)}
    {blocked.map(r=>{const lock=maintenance.get(r.id)!,task=lock.repairTask!,label=`${r.name} · ${lock.direct?'Maintenance required':'Paused by upstream maintenance'} · repair ${taskById(task).title}`;return <g key={`maintenance-${r.id}`} className={`map-maintenance-marker ${lock.direct?'is-direct':''}`} transform={`translate(${r.x*CELL} ${r.z*CELL-u*6}) scale(${u})`} role="button" tabIndex={0} aria-label={label} onClick={()=>useTrainingUI.getState().repair(task)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();useTrainingUI.getState().repair(task)}}}><title>{label}</title><circle r="8" fill={lock.direct?'#641b24':'#48301c'} stroke={lock.direct?'#ff9681':'#ffd296'} strokeWidth="1.4"/><Wrench x={-5.5} y={-5.5} width={11} height={11} stroke={lock.direct?'#ffe5dc':'#ffdc9e'} strokeWidth={2.3}/></g>})}
    <g transform={`translate(${l.relay[0]} ${l.relay[2]}) scale(${u})`}><path d="M0-4 4 0 0 4-4 0Z" fill="#e0c478" stroke="#202a25" strokeWidth="1"/>{mapExpanded&&<text x="7" y="2.5" fill="#e0d5ac" fontSize="7">RELAY</text>}</g>
    {LANDMARKS.filter(site=>mapContains(view,site.x,site.z)).map(site=><g key={site.id} transform={`translate(${site.x} ${site.z}) scale(${u})`}><path d="M0-4 4 0 0 4-4 0Z" fill="#d7bd80"/><text x="7" y="2" fill="#e4d8b7" fontSize="7" fontFamily="Inter,Segoe UI,sans-serif">{site.name}</text></g>)}
    {rovers.filter(r=>mapContains(view,r.position[0],r.position[2])).map(r=><g key={r.id} transform={`translate(${r.position[0]} ${r.position[2]}) scale(${u})`}><title>{r.name}</title><g transform={`rotate(${r.heading*180/Math.PI})`}><rect x="-3.5" y="-5.5" width="7" height="11" rx="1" fill="#dcc478" stroke="#25302d" strokeWidth="1"/><path d="M-2-2 H2" stroke="#4b5140" strokeWidth="1.3"/></g>{mapExpanded&&<text x="6" y="2" fontSize="7" fill="#e4d6a4" fontFamily="Inter,Segoe UI,sans-serif">{r.name}</text>}</g>)}
    {Object.entries(crewPositions).filter(([id,p])=>id!==playerId&&crew.some(c=>c.id===id&&c.alive)&&mapContains(view,p.x,p.z)).map(([id,p])=>{const c=crew.find(c=>c.id===id)!,sleeping=p.activity==='sleeping';return <g key={id} transform={`translate(${p.x} ${p.z}) scale(${u})`}><title>{c.name} · {p.activity}</title><circle r="4.5" fill={sleeping?'#839ac7':'#6cccb5'} stroke="#e0eade" strokeWidth=".8"/><text textAnchor="middle" y="1.5" fill="#122d2a" fontSize="4.5" fontFamily="Inter,Segoe UI,sans-serif" fontWeight="bold">{sleeping?'z':c.name.split(' ').map(n=>n[0]).join('')}</text>{mapExpanded&&<text x="7" y="2" fill="#d4ebe1" fontSize="7" fontFamily="Inter,Segoe UI,sans-serif">{c.name.split(' ')[0]}{sleeping?' · Zz':''}</text>}</g>})}
    {mapContains(view,position[0],position[2])&&<g transform={`translate(${position[0]} ${position[2]}) rotate(${heading*180/Math.PI}) scale(${u})`}><path d="M0 0 L-23-40 A46 46 0 0 1 23-40Z" fill={`url(#${cone})`}/><circle r="8" fill="#97e3d1" fillOpacity=".1"/><path d="M0-7-4.5 5 0 2.5 4.5 5Z" fill="#f0fff4" stroke="#23433b" strokeWidth="1.1"/></g>}
    {view.following&&!mapContains(view,base.x,base.z)&&<g transform={`translate(${edge.x} ${edge.z}) scale(${u})`}><path d="M0-6-4 3 0 1 4 3Z" transform={`rotate(${edge.heading})`} fill="#e0d5ae"/><text y="13" textAnchor="middle" fill="#e0d5ae" fontSize="7" fontFamily="Inter,Segoe UI,sans-serif">BASE</text></g>}
   </svg>
  </div>
  <footer><strong>{location}</strong><span><i/> YOU <b>·</b> AIRLOCK {distance.toFixed(0)} m</span></footer>
  {blocked.length>0&&<div className="map-maintenance-key"><Wrench size={12}/><span>{blocked.length} rooms in maintenance</span><small>Red: repair · amber: dependent</small></div>}
  {mapExpanded&&<div className="base-map-legend"><span><i className="legend-you"/> You</span><span><i className="legend-crew"/> Crew</span><span><i className="legend-sleep"/> Sleeping</span><span><i className="legend-rover"/> Rovers</span><p>North stays up · White arrow shows your look direction</p></div>}
 </aside>;
}
