import { useTrainingUI } from '../training/ui';
import { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Html } from '@react-three/drei';
import * as THREE from 'three';
import { BuildingModel, Rover } from './Buildings';
import { AstronautModel } from '../characters/AstronautModel';
import { IndustrialLighting } from '../visuals/IndustrialLighting';
import { INDUSTRIAL as C } from '../visuals/palette';
import { useGame, simulationSnapshot } from '../store/game';
import { calculateOperations } from '../simulation/lifeSupport';
import { commissioningComplete, facilityUnlocked } from '../simulation/commissioning';
import { canWork } from '../simulation/scenario';
import { catalog, validPlacement } from '../simulation/engine';
import { ExpansionPlots } from './ExpansionPlots';
import { WORLD, elevation, insideBuildArea, ownedPlots, expansionCandidates, BASE_PLOT, type LandPlot } from './worldConfig';
function Terrain({plots}:{plots:LandPlot[]}){
 const geometry=useMemo(()=>{const g=new THREE.PlaneGeometry(WORLD.terrainWidth,WORLD.terrainDepth,240,230);g.rotateX(-Math.PI/2);const p=g.attributes.position;const colors=[];for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),y=elevation(x,z,plots);p.setY(i,y);const v=.89+.12*Math.sin(x*1.8+z*2.1)+.06*Math.sin(x*8);const c=new THREE.Color(C.dust).multiplyScalar(v+(y*.025));colors.push(c.r,c.g,c.b);}g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;},[plots]);
 const texture=useMemo(()=>{const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d')!;const d=ctx.createImageData(512,512);let seed=5;for(let i=0;i<d.data.length;i+=4){seed=(seed*16807)%2147483647;const n=155+(seed%85);d.data.set([n,n*.85,n*.7,255],i);}ctx.putImageData(d,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(28,28);return t;},[]);
 return <mesh geometry={geometry} receiveShadow><meshStandardMaterial vertexColors map={texture} bumpMap={texture} bumpScale={.13} roughness={1}/></mesh>
}
function Rocks({plots}:{plots:LandPlot[]}){const rocks=useMemo(()=>{let seed=30;const rand=()=>{seed=seed*16807%2147483647;return seed/2147483647};return Array.from({length:260},()=>{const x=(rand()-.5)*105,z=(rand()-.5)*95;return {x,z,s:.12+rand()*(Math.hypot(x,z)>28&&!plots.some(p=>x>p.minX-1&&x<p.maxX+1&&z>p.minZ-1&&z<p.maxZ+1)?2.6:.35),r:rand()*6}})},[plots]);return <group>{rocks.map((r,i)=><mesh key={i} position={[r.x,elevation(r.x,r.z,plots)+r.s*.2,r.z]} scale={[r.s,r.s*.55,r.s*.8]} rotation={[r.r,0,r.r]} castShadow receiveShadow><dodecahedronGeometry args={[1,0]}/><meshStandardMaterial color={i%3===0?'#793c2a':'#a85736'} roughness={1}/></mesh>)}</group>}
function Corridors(){const buildings=useGame(s=>s.buildings);const paths=useMemo(()=>buildings.slice(1).filter(b=>b.kind!=='solar').map((b)=>{const targets=buildings.filter(a=>a.id!==b.id&&a.kind!=='solar'&&Math.hypot(a.x,a.z)<Math.hypot(b.x,b.z));const a=targets.sort((a,c)=>Math.hypot(a.x-b.x,a.z-b.z)-Math.hypot(c.x-b.x,c.z-b.z))[0]??buildings[0];const length=Math.hypot(a.x-b.x,a.z-b.z);return {x:(a.x+b.x)/2,z:(a.z+b.z)/2,length,angle:Math.atan2(a.x-b.x,a.z-b.z)};}),[buildings]);return <group>{paths.map((p,i)=><group key={i} position={[p.x,.25,p.z]} rotation={[0,p.angle,0]}><mesh rotation={[Math.PI/2,0,0]} castShadow receiveShadow><cylinderGeometry args={[.28,.28,p.length,10]}/><meshStandardMaterial color="#b7b6a5" roughness={.65} metalness={.4}/></mesh>{Array.from({length:Math.floor(p.length)},(_,j)=><mesh key={j} position={[0,0,j-p.length/2+.5]}><torusGeometry args={[.3,.035,5,12]}/><meshStandardMaterial color="#747b77"/></mesh>)}</group>)}</group>}
function World({resetKey}:{resetKey:number}){
 const sim=useGame();const operations=useMemo(()=>calculateOperations(simulationSnapshot(sim)).report,[sim]);
 const dust=sim.environment.dustUntil>sim.sol;
 const terrainPlots=useMemo(()=>[
  ...ownedPlots(sim.expandedPlots),
  // Keep pre-existing buildings from the previous larger-map version intact.
  // These tiny foundations preserve the buildings without unlocking nearby land.
  ...sim.buildings.filter(b=>!insideBuildArea(b.x,b.z,catalog[b.kind].radius,sim.expandedPlots)).map(b=>({id:`foundation-${b.id}`,minX:b.x-catalog[b.kind].radius,maxX:b.x+catalog[b.kind].radius,minZ:b.z-catalog[b.kind].radius,maxZ:b.z+catalog[b.kind].radius})),
 ],[sim.expandedPlots,sim.buildings]);
 const candidates=useMemo(()=>expansionCandidates(sim.expandedPlots),[sim.expandedPlots]);
 const bounds=useMemo(()=>{const p=[BASE_PLOT,...ownedPlots(sim.expandedPlots)];return {minX:Math.min(...p.map(p=>p.minX)),maxX:Math.max(...p.map(p=>p.maxX)),minZ:Math.min(...p.map(p=>p.minZ)),maxZ:Math.max(...p.map(p=>p.maxZ))};},[sim.expandedPlots]);
 const buildBoundary=useMemo(()=>new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(-WORLD.buildHalfWidth,.14,-WORLD.buildHalfDepth),
  new THREE.Vector3(WORLD.buildHalfWidth,.14,-WORLD.buildHalfDepth),
  new THREE.Vector3(WORLD.buildHalfWidth,.14,WORLD.buildHalfDepth),
  new THREE.Vector3(-WORLD.buildHalfWidth,.14,WORLD.buildHalfDepth),
 ]),[]);
 const blocked=sim.effects.some(e=>e.constructionHold&&e.untilSol>sim.sol)||!!sim.pendingEvent;

 const buildings=useGame(s=>s.buildings),selected=useGame(s=>s.selected),placing=useGame(s=>s.placing),select=useGame(s=>s.select),place=useGame(s=>s.place),materials=useGame(s=>s.resources.materials);
 const [hover,setHover]=useState<[number,number]>([22,-15]);const controls=useRef<any>(null);
 useEffect(()=>{controls.current?.reset()},[resetKey]);
 const valid=placing?validPlacement(placing,...hover,buildings,sim.expandedPlots)&&materials>=catalog[placing].cost&&!blocked:false;
 const pointer=(e:ThreeEvent<PointerEvent>)=>{if(placing){setHover([Math.round(e.point.x*2)/2,Math.round(e.point.z*2)/2]);}};
 return <><color attach="background" args={[C.sky]}/><fog attach="fog" args={dust?[C.fog,30,95]:[C.fog,65,160]}/><IndustrialLighting/>
 <Terrain plots={terrainPlots}/><Rocks plots={terrainPlots}/><Corridors/>{sim.expanding&&<ExpansionPlots plots={candidates} terrainPlots={terrainPlots}/>}
 {buildings.map(b=><group key={b.id} position={[b.x,elevation(b.x,b.z,terrainPlots),b.z]} onClick={e=>{if(!placing&&!sim.expanding){e.stopPropagation();select(b.id)}}} onPointerOver={()=>{if(!placing&&!sim.expanding)document.body.style.cursor='pointer'}} onPointerOut={()=>{document.body.style.cursor='auto'}}><BuildingModel kind={b.kind} operating={b.active&&(b.damage??0)<80&&(operations.powered[b.id]??1)>0&&!(b.kind==='solar'&&(dust||sim.resources.power<10))} damaged={(b.damage??0)>0}/>
 {(b.damage??0)>0&&<Html position={[0,3.5,0]} center><span className="facility-warning">{b.repairUntil?`⚒ REPAIR · SOL ${b.repairUntil}`:'⚠ FAULT'}</span></Html>}
 {b.kind==='habitat'&&sim.effects.some(e=>e.shelter&&e.untilSol>sim.sol)&&<mesh rotation={[-Math.PI/2,0,0]} position={[0,.15,0]}><ringGeometry args={[3.2,3.4,64]}/><meshBasicMaterial color="#73d5de"/></mesh>}
{selected===b.id&&<><mesh rotation={[-Math.PI/2,0,0]} position={[0,.12,0]}><ringGeometry args={[catalog[b.kind].radius+.15,catalog[b.kind].radius+.23,64]}/><meshBasicMaterial color="#8de4de" side={THREE.DoubleSide}/></mesh><Html position={[0,4,0]} center><div className="world-label">{catalog[b.kind].name} <span>{(b.damage??0)>=80?'FAULT':b.active?'ONLINE':'OFFLINE'}</span></div></Html></>}{!b.active&&selected===b.id&&<Html position={[0,3,0]} center><span className={`offline ${!facilityUnlocked(sim,b.kind)?'facility-locked':''}`}>{facilityUnlocked(sim,b.kind)?'OFFLINE':`${catalog[b.kind].name} · LOCKED`}</span></Html>}</group>)}
 {[[-4,4],[5,-11],[12,13]].map(([x,z],i)=><group key={i} position={[x,elevation(x,z,terrainPlots),z]} rotation={[0,i,0]}><Rover/></group>)}
 {sim.astronauts.filter(c=>commissioningComplete(sim)&&canWork(c)&&c.assignment==='maintenance'&&!dust&&!sim.effects.some(e=>(e.shelter||e.constructionHold)&&e.untilSol>sim.sol)).map(c=><group key={c.id} position={[-5,.1,3]}><AstronautModel height={.98}/><Html position={[0,1.3,0]} center><span className="astronaut-tag">{c.name.split(' ')[0]} · EVA</span></Html></group>)}
 {/* A broad invisible raycast surface lets construction select terrain without intercepting orbit gestures. */}
 {placing&&<>{ownedPlots(sim.expandedPlots).map(p=><lineLoop key={p.id}><bufferGeometry><bufferAttribute attach="attributes-position" args={[new Float32Array([p.minX,.14,p.minZ,p.maxX,.14,p.minZ,p.maxX,.14,p.maxZ,p.minX,.14,p.maxZ]),3]}/></bufferGeometry><lineBasicMaterial color="#b2e3cf" transparent opacity={.45}/></lineLoop>)}<lineLoop geometry={buildBoundary}><lineBasicMaterial color="#b2e3cf" transparent opacity={.45}/></lineLoop><mesh rotation={[-Math.PI/2,0,0]} position={[0,.16,0]} onPointerMove={pointer} onClick={e=>{e.stopPropagation();place(Math.round(e.point.x*2)/2,Math.round(e.point.z*2)/2)}}><planeGeometry args={[WORLD.terrainWidth,WORLD.terrainDepth]}/><meshBasicMaterial transparent opacity={0} depthWrite={false}/></mesh><group position={[hover[0],elevation(...hover,terrainPlots)+.18,hover[1]]}><group raycast={()=>null}><BuildingModel kind={placing}/></group><mesh rotation={[-Math.PI/2,0,0]}><ringGeometry args={[catalog[placing].radius,catalog[placing].radius+.14,64]}/><meshBasicMaterial color={valid?'#6af1b6':'#ff514c'} side={THREE.DoubleSide}/></mesh><Html position={[0,4,0]} center><div className={`world-label ${valid?'':'invalid'}`}>{valid?'CLICK TO CONSTRUCT':'BLOCKED / INSUFFICIENT MATERIALS'}</div></Html></group></>}
 <ContactShadows position={[0,.08,0]} opacity={.25} scale={sim.expandedPlots.length?110:65} blur={2} far={6} resolution={256}/>
 <OrbitControls ref={controls} makeDefault target={[0,0,5]} enableDamping dampingFactor={.08} minDistance={22} maxDistance={sim.expandedPlots.length?130:WORLD.maxCameraDistance} maxPolarAngle={Math.PI/2.3} minPolarAngle={.3} onEnd={()=>{if(controls.current){const t=controls.current.target; t.x=THREE.MathUtils.clamp(t.x,bounds.minX+3,bounds.maxX-3);t.z=THREE.MathUtils.clamp(t.z,bounds.minZ+3,bounds.maxZ-3);t.y=0;}}}/>
 </>
}
export default function Scene({resetKey}:{resetKey:number}){const trainingOpen=useTrainingUI(s=>s.open);return <Canvas frameloop={trainingOpen?'never':'always'} shadows dpr={[1,1.5]} camera={{position:[44,49,54],fov:43,near:.1,far:WORLD.cameraFar}} gl={{antialias:true,toneMapping:THREE.ACESFilmicToneMapping,toneMappingExposure:.95}} onPointerMissed={()=>{if(!useGame.getState().placing&&!useGame.getState().expanding)useGame.getState().select(null)}}><World resetKey={resetKey}/></Canvas>}
