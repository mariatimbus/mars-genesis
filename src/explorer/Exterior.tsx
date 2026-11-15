import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { RigidBody, CuboidCollider, ConvexHullCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { useGame } from '../store/game';
import { ownedPlots, type LandPlot } from '../game/worldConfig';
import { BuildingModel } from '../game/Buildings';
import { useExplorer } from './store';
import { CELL, FLOOR, type Layout, type Point } from './layout';
import { terrainHeight, meshGroundHeight } from './fixtures';
import { airlockRamp, exteriorPlan, routeSamples, type Site, type Route, type Rock } from './exteriorPlan';
import { seededRandom } from './terrain';
import { StreamedTerrain } from './StreamedTerrain';
import { RoverFleet } from './Rovers';
import { LANDMARKS, CHUNK_SIZE, surfaceDistance } from './planet';
import { exteriorClear, overlaps } from './fixtures';
import { INDUSTRIAL as C } from '../visuals/palette';
import { HazardStrip, Pipe } from '../visuals/IndustrialKit';
import { activeSurfaceIncidents,roomSuspended } from '../weather/incidents';

function regolithTexture(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
 const ctx=canvas.getContext('2d')!,pixels=ctx.createImageData(512,512),random=seededRandom(81);
 for(let y=0;y<512;y++)for(let x=0;x<512;x++){
  const ripple=Math.sin(x*.07+y*.11+Math.sin(y*.032)*3)*5,n=163+random()*54+ripple,i=(y*512+x)*4;
  pixels.data.set([n,n*.94,n*.84,255],i);
 }
 ctx.putImageData(pixels,0,0);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(85,85);texture.anisotropy=8;return texture;
}
function Sign({text,position,width=2.6,rotation=0,postHeight=0}:{text:string;position:Point;width?:number;rotation?:number;postHeight?:number}){
 const texture=useMemo(()=>{
  const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d')!;
  ctx.fillStyle=C.screen;ctx.fillRect(0,0,1024,256);ctx.fillStyle=C.yellow;ctx.fillRect(0,0,16,256);
  ctx.font='500 54px Inter,Segoe UI,sans-serif';ctx.fillStyle=C.green;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,520,120,960);
  ctx.fillStyle=C.blue;ctx.font='23px Inter,Segoe UI,sans-serif';ctx.fillText('ARES ONE / SURFACE OPERATIONS',520,214,930);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
 },[text]);
 useEffect(()=>()=>texture.dispose(),[texture]);
 return <group position={position} rotation={[0,rotation,0]}><mesh><planeGeometry args={[width,width/4]}/><meshStandardMaterial map={texture} roughness={.8} side={THREE.DoubleSide}/></mesh>{postHeight>0&&[-1,1].map(side=><mesh key={side} position={[side*width*.35,-postHeight/2,-.03]}><boxGeometry args={[.045,postHeight,.045]}/><meshStandardMaterial color="#667a7b" metalness={.5} roughness={.6}/></mesh>)}</group>;
}
function RockField({rocks,layout,plots}:{rocks:Rock[];layout:Layout;plots:LandPlot[]}){
 const ref=useRef<THREE.InstancedMesh>(null);
 const geometry=useMemo(()=>{
  const g=new THREE.IcosahedronGeometry(1,1),p=g.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),rough=1+.1*Math.sin(x*13+y*7+z*9);p.setXYZ(i,x*rough,y*(.9+.08*Math.sin(x*18)),z*rough)}
  g.computeVertexNormals();return g;
 },[]);
 const placed=useMemo(()=>rocks.map(r=>({...r,y:meshGroundHeight(layout,r.x,r.z,plots)+r.scale[1]*.6,vertices:new Float32Array(Array.from(geometry.attributes.position.array,(v,i)=>v*r.scale[i%3]))})),[rocks,geometry,layout,plots]);
 useLayoutEffect(()=>{
  const object=new THREE.Object3D(),color=new THREE.Color();
  placed.forEach((r,i)=>{object.position.set(r.x,r.y,r.z);object.scale.set(...r.scale);object.rotation.set(...r.rotation);object.updateMatrix();ref.current?.setMatrixAt(i,object.matrix);ref.current?.setColorAt(i,color.set(i%4===0?'#41414e':i%3===0?'#70584e':'#5b4850'))});
  if(ref.current){ref.current.instanceMatrix.needsUpdate=true;if(ref.current.instanceColor)ref.current.instanceColor.needsUpdate=true;ref.current.computeBoundingSphere()}
 },[placed]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 return <><instancedMesh ref={ref} args={[geometry,undefined,placed.length]} castShadow receiveShadow><meshStandardMaterial roughness={.98}/></instancedMesh>
  {placed.filter(r=>r.solid).map((r,i)=><RigidBody key={i} type="fixed" colliders={false} position={[r.x,r.y,r.z]} rotation={r.rotation}><ConvexHullCollider args={[r.vertices]}/></RigidBody>)}
 </>;
}
function Ribbon({route,layout,plots}:{route:Route;layout:Layout;plots:LandPlot[]}){
 const geometry=useMemo(()=>{
  const samples=routeSamples(route,.6),vertices:number[]=[],indices:number[]=[];
  samples.forEach((p,i)=>{const next=samples[Math.min(i+1,samples.length-1)],prev=samples[Math.max(0,i-1)],dx=next[0]-prev[0],dz=next[2]-prev[2],length=Math.hypot(dx,dz)||1;
   for(const side of [-1,1]){const x=p[0]-dz/length*1.2*side,z=p[2]+dx/length*1.2*side;vertices.push(x,meshGroundHeight(layout,x,z,plots)+.08,z)}
   if(i){const a=(i-1)*2,b=i*2;indices.push(a,a+1,b,b,a+1,b+1)}
  });
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;
 },[route,layout,plots]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 const samples=useMemo(()=>routeSamples(route,4),[route]);
 return <><mesh geometry={geometry} receiveShadow><meshStandardMaterial color="#82705c" roughness={1} transparent opacity={.38} depthWrite={false} side={THREE.DoubleSide}/></mesh>
  {samples.slice(1,-1).map((p,i)=>{const next=samples[i+2],dx=next[0]-p[0],dz=next[2]-p[2],length=Math.hypot(dx,dz)||1;
   return [-1,1].map(side=>{const x=p[0]-dz/length*2.05*side,z=p[2]+dx/length*2.05*side,y=meshGroundHeight(layout,x,z,plots);
    return <group key={`${i}-${side}`} position={[x,y,z]}><mesh position={[0,.42,0]}><cylinderGeometry args={[.045,.06,.84,8]}/><meshStandardMaterial color="#697376" roughness={.75} metalness={.4}/></mesh><mesh position={[0,.82,0]}><cylinderGeometry args={[.075,.075,.16,8]}/><meshStandardMaterial color={route.id==='relay'?'#f5bc78':'#a4d7db'} emissive={route.id==='relay'?'#e0a058':'#70bcc5'} emissiveIntensity={1.5}/></mesh></group>;
   });
  })}
 </>;
}
function LandingPad({site,layout,plots}:{site:Site;layout:Layout;plots:LandPlot[]}){
 const geometry=useMemo(()=>{
  const g=new THREE.RingGeometry(5.7,6,96),p=g.attributes.position;
  for(let i=0;i<p.count;i++){const x=site.x+p.getX(i),z=site.z+p.getY(i);p.setXYZ(i,x,meshGroundHeight(layout,x,z,plots)+.08,z)}g.computeVertexNormals();return g;
 },[site,layout,plots]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 return <><mesh geometry={geometry}><meshBasicMaterial color="#d9bf96" transparent opacity={.65} depthWrite={false} side={THREE.DoubleSide}/></mesh>
  <Sign text="A-01 / ROVER BAY" position={[site.x,meshGroundHeight(layout,site.x,site.z+6.5,plots)+1.3,site.z+6.5]} width={3.6} postHeight={1.3}/>
  {[0,1,2,3].map(i=>{const angle=i*Math.PI/2+.7,x=site.x+Math.sin(angle)*7,z=site.z+Math.cos(angle)*7;return <mesh key={i} position={[x,meshGroundHeight(layout,x,z,plots)+.13,z]}><cylinderGeometry args={[.25,.3,.26,12]}/><meshStandardMaterial color="#e4bf81" emissive="#a67c3f" emissiveIntensity={.5} metalness={.4}/></mesh>})}
 </>;
}
function SurfaceEquipment({site,layout,plots}:{site:Site;layout:Layout;plots:LandPlot[]}){
 const y=meshGroundHeight(layout,site.x,site.z,plots);
 return <group position={[site.x,y,site.z]}>
  {site.kind==='comms'?<>
   <RigidBody type="fixed" colliders={false}><CuboidCollider position={[0,.22,0]} args={[1.5,.22,1.5]}/><CuboidCollider position={[0,2.7,0]} args={[.17,2.7,.17]}/>
    <mesh position={[0,.22,0]} castShadow><boxGeometry args={[3,.44,3]}/><meshStandardMaterial color="#42495e" metalness={.4} roughness={.7}/></mesh>
    <mesh position={[0,2.7,0]} castShadow><cylinderGeometry args={[.13,.22,5.4,12]}/><meshStandardMaterial color="#8a90a7" metalness={.65} roughness={.45}/></mesh>
    <group position={[0,5.5,0]} rotation={[.65,0,-.3]}><mesh castShadow><sphereGeometry args={[1.65,32,12,0,Math.PI*2,0,.9]}/><meshStandardMaterial color="#777e96" metalness={.55} roughness={.4} side={THREE.DoubleSide}/></mesh><mesh position={[0,.8,0]}><cylinderGeometry args={[.045,.045,1.7,8]}/><meshStandardMaterial color="#5f7378" metalness={.65}/></mesh></group>
    <mesh position={[0,6,0]}><sphereGeometry args={[.07,8,8]}/><meshBasicMaterial color="#e9b17b"/></mesh>
   </RigidBody>
  </>:site.kind==='cargo'?<>
   {[-2,1.5].map((x,i)=><RigidBody key={i} type="fixed" colliders={false} position={[x,.85,0]}><CuboidCollider args={[1.1,.85,1.4]}/><mesh castShadow receiveShadow><boxGeometry args={[2.2,1.7,2.8]}/><meshStandardMaterial color={i?'#60667d':'#4c4358'} metalness={.35} roughness={.8}/></mesh>{[-.85,.85].map(side=><mesh key={side} position={[side,0,1.415]}><boxGeometry args={[.07,1.5,.04]}/><meshStandardMaterial color="#282b3f" metalness={.6}/></mesh>)}<mesh position={[0,.53,1.43]}><boxGeometry args={[1.8,.18,.035]}/><meshStandardMaterial color="#b0a449" roughness={.7}/></mesh></RigidBody>)}
  </>:<>
   <RigidBody type="fixed" colliders={false}><CuboidCollider position={[0,1.6,0]} args={[.09,1.6,.09]}/><mesh position={[0,1.6,0]} castShadow><cylinderGeometry args={[.065,.09,3.2,12]}/><meshStandardMaterial color="#777d97" metalness={.5}/></mesh><mesh position={[0,2,0]}><boxGeometry args={[.65,.7,.42]}/><meshStandardMaterial color="#545b73" roughness={.6}/></mesh>{[0,1,2].map(i=><mesh key={i} position={[0,2.7+i*.1,0]}><cylinderGeometry args={[.3,.3,.035,16]}/><meshStandardMaterial color="#7b849c" roughness={.65}/></mesh>)}<mesh position={[0,3.35,0]}><boxGeometry args={[1.4,.06,.12]}/><meshStandardMaterial color="#515e7c" metalness={.5}/></mesh></RigidBody>
  </>}
  <Sign text={site.label} position={[0,.95,site.depth/2]} width={site.kind==='weather'?1.9:2.6} postHeight={.95}/>
 </group>;
}
function AirlockExterior({layout:l}:{layout:Layout}){
 const ramp=useMemo(()=>airlockRamp(l),[l]);
 const geometry=useMemo(()=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(ramp.vertices,3));g.setIndex(ramp.indices);g.computeVertexNormals();return g},[ramp]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 return <>
  <RigidBody type="fixed" colliders={false}><ConvexHullCollider args={[ramp.vertices]}/><mesh geometry={geometry} castShadow receiveShadow><meshStandardMaterial color="#41485f" metalness={.45} roughness={.8} side={THREE.DoubleSide}/></mesh></RigidBody>
  <group position={[l.airlock.x,FLOOR,l.airlock.outerZ+.14]}>
   {[-1,1].map(side=><group key={side}><mesh position={[side*1.65,1.6,0]} castShadow><boxGeometry args={[.25,3.3,.3]}/><meshStandardMaterial color="#535b72" metalness={.6} roughness={.55}/></mesh><mesh position={[side*1.65,2.5,.17]}><boxGeometry args={[.1,.55,.05]}/><meshStandardMaterial color="#a3d4c7" emissive="#73c9b7" emissiveIntensity={1.5}/></mesh></group>)}
   <HazardStrip position={[0,3.13,.27]} size={[3.2,.1,.04]}/><mesh position={[0,3.33,0]} castShadow><boxGeometry args={[3.6,.2,.5]}/><meshStandardMaterial color="#7b8097" metalness={.45}/></mesh>
   <Sign text="ARES ONE / AIRLOCK" position={[0,2.95,.19]} width={2.7}/>
  </group>
 </>;
}
function RoofDetails({layout:l}:{layout:Layout}){
 return <>{l.rooms.map((r,i)=><group key={r.id} position={[r.x*CELL,FLOOR+3.42,r.z*CELL]}>
  <Pipe points={[[.2,.1,.2],[.2,.3,.2],[1.4,.3,.2]]} radius={.055} color={C.burgundy}/><mesh position={[1,.12,-1]} castShadow><boxGeometry args={[1.6,.24,1.25]}/><meshStandardMaterial color="#4a5066" roughness={.75} metalness={.35}/></mesh>
  {[-.4,0,.4].map(z=><mesh key={z} position={[1,.26,-1+z]}><boxGeometry args={[1.4,.04,.11]}/><meshStandardMaterial color="#20263c" roughness={.8}/></mesh>)}
  <mesh position={[-1,.08,1]}><cylinderGeometry args={[.48,.5,.16,24]}/><meshStandardMaterial color="#727d91" metalness={.45} roughness={.65}/></mesh>
  {i%3===0&&<mesh position={[-1,.75,1]}><cylinderGeometry args={[.025,.025,1.3,8]}/><meshStandardMaterial color="#666f89" metalness={.6}/></mesh>}
 </group>)}</>;
}
export function MarsExterior({layout:l,preview=false}:{layout:Layout;preview?:boolean}){
 const dustCovered=useGame(s=>activeSurfaceIncidents(s).some(e=>e.task==='dust')),solarOnline=useGame(s=>!roomSuspended(s,'solar'));
 const buildings=useGame(s=>s.buildings),expanded=useGame(s=>s.expandedPlots),plots=useMemo(()=>ownedPlots(expanded),[expanded]);
 const plan=useMemo(()=>exteriorPlan(l,buildings),[l,buildings]),texture=useMemo(()=>regolithTexture(),[]);
 const position=useExplorer.getState().position;
 const cx=useExplorer(s=>Math.floor((preview?0:s.position[0])/CHUNK_SIZE)),cz=useExplorer(s=>Math.floor((preview?0:s.position[2])/CHUNK_SIZE));
 const extraRocks=useMemo(()=>{
  const rocks:Rock[]=[];
  for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++){
   const xTile=cx+dx,zTile=cz+dz,random=seededRandom(Math.imul(xTile,73856093)^Math.imul(zTile,19349663)^779);
   for(let i=0;i<14;i++){const x=(xTile+random())*CHUNK_SIZE,z=(zTile+random())*CHUNK_SIZE,size=i<2?.6+random()*1.4:.1+random()*.3,scale:Point=[size*1.3,size*.65,size],foot={x,z,width:size*3.5,depth:size*3.5};
    if(Math.hypot(x,z)<220||!exteriorClear(l,foot,1)||LANDMARKS.some(site=>['outpost','wreck'].includes(site.kind)&&surfaceDistance({x,z},site)<15))continue;
    if(plan.arrays.some(a=>overlaps(a,foot,1))||plan.sites.some(a=>overlaps(a,foot,1)))continue;
    rocks.push({...foot,scale,rotation:[random()*.3,random()*Math.PI*2,random()*.3],solid:size>.6});
   }
  }return rocks;
 },[cx,cz,l,plan]);
 useEffect(()=>()=>texture.dispose(),[texture]);
 return <>
  <StreamedTerrain layout={l} plots={plots} texture={texture} focus={preview?[0,0,0]:undefined}/>
  {plan.arrays.map(({building:b,x,z})=><group key={b.id} position={[x,meshGroundHeight(l,x,z,plots),z]}><RigidBody type="fixed" colliders={false}>
   {[-1.7,0,1.7].map(offset=><group key={offset}><CuboidCollider position={[offset*3,2.7,0]} rotation={[-.2,0,0]} args={[2.325,.18,7.95]}/><CuboidCollider position={[offset*3,2.7-1.8*Math.cos(.2),1.8*Math.sin(.2)]} rotation={[-.2,0,0]} args={[.18,1.5,5.4]}/></group>)}
   <group scale={3}><BuildingModel kind="solar" operating={b.active&&solarOnline} dustCovered={dustCovered}/></group>
  </RigidBody></group>)}
  <RockField rocks={plan.rocks} layout={l} plots={plots}/><RockField rocks={extraRocks} layout={l} plots={plots}/>
  {plan.routes.map(r=><Ribbon key={r.id} route={r} layout={l} plots={plots}/>)}
  {plan.sites.map(s=>s.kind==='landing'?<LandingPad key={s.id} site={s} layout={l} plots={plots}/>:<SurfaceEquipment key={s.id} site={s} layout={l} plots={plots}/>)}
  <AirlockExterior layout={l}/><RoofDetails layout={l}/><RoverFleet layout={l} preview={preview}/>
  {!preview&&LANDMARKS.filter(site=>Math.hypot(site.x-position[0],site.z-position[2])<450).map(site=><group key={site.id}>
   <Sign text={site.name.toUpperCase()} position={[site.x,meshGroundHeight(l,site.x,site.z,plots)+2,site.z]} width={4} postHeight={2}/>
   {['outpost','wreck'].includes(site.kind)&&<SurfaceEquipment site={{...site,kind:site.kind==='outpost'?'cargo':'weather',width:8,depth:6,label:site.kind==='outpost'?'EXPEDITION CHARGER':'SURVEY LANDER'}} layout={l} plots={plots}/>}
  </group>)}
 </>;
}
export { MarsAtmosphere as MarsSky } from '../weather/MarsAtmosphere';
