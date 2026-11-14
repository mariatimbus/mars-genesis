import { useEffect, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { X, Navigation, MapPin, Globe2 } from 'lucide-react';
import * as THREE from 'three';
import { useExplorer } from './store';
import { LANDMARKS, PLANET_CIRCUMFERENCE, planetDirection, canonicalPosition, surfaceDistance, surfaceBearing, formatDistance } from './planet';
import { marsSurfaceHeight } from './terrain';
import type { Layout } from './layout';

function Globe({layout:l}:{layout:Layout}){
 const globe=useRef<THREE.Mesh>(null!),e=useExplorer(),position=e.position,geometry=useMemo(()=>{
  const vertices:number[]=[],colors:number[]=[],indices:number[]=[],width=96,height=48;
  for(let row=0;row<=height;row++)for(let col=0;col<=width;col++){
   const x=(col/width-.5)*PLANET_CIRCUMFERENCE,z=(row/height-.5)*PLANET_CIRCUMFERENCE/2,d=planetDirection(x,z),h=marsSurfaceHeight(x,z),radius=2.15+h*.00025;
   vertices.push(...d.map(v=>v*radius));const color=new THREE.Color(Math.abs(d[1])>.95?'#dfd4c3':h>140?'#514754':h<60?'#b2836b':'#895b50');color.multiplyScalar(.9+.1*Math.sin(x*.005+z*.007));colors.push(color.r,color.g,color.b);
   if(row<height&&col<width){const a=row*(width+1)+col,b=a+width+1;indices.push(a,b,a+1,b,b+1,a+1)}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();return g;
 },[]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 const markers=[{id:'base',name:'ARES ONE',x:l.habitat.x*3,z:l.habitat.z*3,color:'#96e1b6'},...LANDMARKS.map(s=>({...s,color:e.visited.includes(s.id)?'#debb7d':'#acb5b9'})),{id:'player',name:'YOU',x:position[0],z:position[2],color:'#c0efff'}];
 return <><ambientLight intensity={.75}/><directionalLight position={[4,5,5]} intensity={2.1}/><mesh ref={globe} geometry={geometry}><meshStandardMaterial vertexColors roughness={.95} side={THREE.DoubleSide}/></mesh>
  {markers.map(m=>{const markerRadius=2.15+marsSurfaceHeight(m.x,m.z)*.00025+.025,p=planetDirection(m.x,m.z).map(v=>v*markerRadius) as [number,number,number],selected=m.id===e.waypoint;
   return <group key={m.id} position={p}><mesh onClick={ev=>{ev.stopPropagation();if(m.id!=='player')useExplorer.setState({waypoint:m.id})}}><sphereGeometry args={[selected?.065:.04,12,10]}/><meshBasicMaterial color={selected?'#ffbf75':m.color}/></mesh>{(selected||m.id==='base'||m.id==='player')&&<Html center distanceFactor={7} occlude={[globe]}><span className={`atlas-pin ${m.id==='player'?'is-player':''}`}>{m.name}</span></Html>}</group>;
  })}
  <OrbitControls enablePan={false} minDistance={3.2} maxDistance={10}/>
 </>;
}
export function PlanetAtlas({layout:l}:{layout:Layout}){
 const e=useExplorer(),geo=canonicalPosition(e.position[0],e.position[2]),player={x:e.position[0],z:e.position[2]},base={id:'base',name:'Ares One',kind:'base',x:l.habitat.x*3,z:l.habitat.z*3,description:'Home base · Rover charging · Suit refill'},sites=[base,...LANDMARKS];
 useEffect(()=>{const close=(event:KeyboardEvent)=>{if(event.code==='Escape')useExplorer.getState().open(null)};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[]);
 const direction=planetDirection(player.x,player.z);
 return <div className="planet-atlas-backdrop"><section className="planet-atlas" role="dialog" aria-modal="true" aria-label="Planet atlas">
  <header><div><span className="fps-eyebrow">PLANETARY EXPEDITION / MARS GENESIS</span><h2><Globe2 size={24}/> Mars / planetary atlas</h2><p>32 km circumference · Procedural terrain · Compressed planet scale</p></div><button aria-label="Close planet atlas" onClick={()=>e.open(null)}><X size={20}/></button></header>
  <div className="atlas-globe"><Canvas camera={{position:[direction[0]*7.2,direction[1]*7.2+.4,direction[2]*7.2],fov:45}}><Globe layout={l}/></Canvas><div className="atlas-coordinates"><strong>{Math.abs(geo.latitude).toFixed(2)}° {geo.latitude>=0?'N':'S'} / {Math.abs(geo.longitude).toFixed(2)}° {geo.longitude>=0?'E':'W'}</strong><span>Drag to rotate · Scroll to zoom · Click a marker</span></div></div>
  <aside className="atlas-destinations"><div className="atlas-list-title"><span>EXPEDITION DESTINATIONS</span><small>{e.visited.length} / {LANDMARKS.length} surveyed</small></div>
   {sites.map(site=><button className={`atlas-destination ${e.waypoint===site.id?'selected':''}`} key={site.id} onClick={()=>useExplorer.setState({waypoint:site.id})}><span className="atlas-destination-top"><strong><MapPin size={13}/>{site.name}</strong><em>{formatDistance(surfaceDistance(player,site))}</em></span><span>{site.description}</span><small>{e.waypoint===site.id?'WAYPOINT SET':e.visited.includes(site.id)?'SURVEYED':'SET WAYPOINT'} · {site.kind.toUpperCase()}</small></button>)}
  </aside>
  <footer><span><Navigation size={14}/> Press G for the atlas · M for the local map</span><button onClick={()=>e.open(null)}>Back to expedition</button></footer>
 </section></div>;
}
export function ExpeditionHUD({layout:l}:{layout:Layout}){
 const e=useExplorer(),rover=e.rovers.find(r=>r.id===e.activeRover),target=e.waypoint==='base'?{name:'Ares One',x:l.habitat.x*3,z:l.habitat.z*3}:LANDMARKS.find(s=>s.id===e.waypoint),geo=canonicalPosition(e.position[0],e.position[2]);
 return <>
  <div className="planet-navigation"><span className="fps-eyebrow">{rover?'ROVER EXPEDITION':'SURFACE EXPLORATION'}</span><strong>{target&&<span className="waypoint-bearing" style={{transform:`rotate(${(surfaceBearing({x:e.position[0],z:e.position[2]},target)-e.heading)*180/Math.PI}deg)`}}>↑</span>}{target?.name??'Free exploration'} <em>{target?formatDistance(surfaceDistance({x:e.position[0],z:e.position[2]},target)):''}</em></strong><small>{geo.latitude.toFixed(2)}° / {geo.longitude.toFixed(2)}° · G planet atlas</small></div>
  {rover&&<section className="rover-dashboard" aria-label="Rover driving status"><span className="fps-eyebrow">{rover.name.toUpperCase()} / PRESSURIZED CABIN</span><div><strong>{Math.round(Math.abs(rover.speed)*3.6)}<small>KM/H</small></strong><span>{rover.battery.toFixed(0)}%<small>BATTERY</small></span><span>{formatDistance(rover.odometer)}<small>ODOMETER</small></span></div><p>W/S drive & reverse · A/D steer<br/>Shift boost · Space brake · E exit</p><small>Stop near Ares One or an outpost to charge.</small></section>}
 </>;
}
