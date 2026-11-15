import { Suspense, useEffect,useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { Base } from './World';
import { MarsExterior, MarsSky } from './Exterior';
import { SuitReflections } from '../characters/SuitReflections';
import { CELL, FLOOR, type Layout } from './layout';
import { IndustrialLighting } from '../visuals/IndustrialLighting';
import { INDUSTRIAL as C } from '../visuals/palette';
import { WeatherInspector } from '../weather/WeatherPanel';
import { useSurfaceWeather } from '../weather/store';
import { useExplorer } from './store';

export default function SurfacePreview({layout:l,onClose,interior=false}:{layout:Layout;onClose:()=>void;interior?:boolean}){
 const returnHome=useCallback(()=>{useExplorer.getState().returnToBase(l);onClose()},[l,onClose]);
 useEffect(()=>()=>useSurfaceWeather.getState().preview(null),[]);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.code==='Escape')returnHome()};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[returnHome]);
 const room=l.rooms.find(r=>r.kind==='solar')??l.habitat;
 const camera:[number,number,number]=interior?[room.x*CELL+.6,FLOOR+1.9,room.z*CELL-3]:[l.airlock.x-32,16,l.airlock.outerZ+42];
 const target:[number,number,number]=interior?[room.x*CELL-.3,FLOOR+1.3,room.z*CELL+3]:[l.airlock.x,2,l.airlock.outerZ+10];
 return <main className="surface-preview">
  <Canvas key={interior?'interior':'surface'} shadows dpr={[1,1.5]} camera={{position:camera,fov:interior?72:58,near:.1,far:550}} onCreated={({gl})=>{gl.toneMappingExposure=.95}}>
   <color attach="background" args={[C.sky]}/><fog attach="fog" args={[C.fog,100,360]}/>
   <IndustrialLighting/>
   <SuitReflections/><MarsSky layout={l} preview/>
   <Suspense fallback={null}><Physics gravity={[0,-3.71,0]} paused><MarsExterior layout={l} preview/><Base layout={l}/></Physics></Suspense>
   <OrbitControls makeDefault target={target} minDistance={interior?1:8} maxDistance={interior?8:150} maxPolarAngle={Math.PI/2.05}/>
  </Canvas>
  {!interior&&<WeatherInspector onContinue={returnHome}/>}
  <header className="surface-preview-header"><div><small>{interior?'ARES ONE / ENGINEERING DECK':'ARES ONE / SURFACE SURVEY'}</small><h1>{interior?'Reactor control room':'Mars exterior'}</h1><p>Drag to orbit · Scroll to zoom · Exploration is paused</p></div><button className="enter-first-person" onClick={returnHome}>Return to habitat · Esc</button></header>
 </main>;
}
