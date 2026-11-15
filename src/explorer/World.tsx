import { useCrewLife } from '../characters/crewStore';
import { nightShift } from '../characters/crewRoutine';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MouseLookControls } from './MouseLookControls';
import { RigidBody, CuboidCollider, CapsuleCollider, useRapier, useBeforePhysicsStep, type RapierRigidBody, type RapierCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { useGame, simulationSnapshot } from '../store/game';
import { calculateOperations } from '../simulation/lifeSupport';
import { commissioningComplete } from '../simulation/commissioning';
import { useTrainingUI } from '../training/ui';
import { useExplorer, type Interaction } from './store';
import { createWalker, movementInput, MOVEMENT_CODES, heldKeys } from './movement';
import { panelTexture } from './materials';
import { INDUSTRIAL as C } from '../visuals/palette';
import { Bulkhead, HazardStrip } from '../visuals/IndustrialKit';
import { IndustrialStructure } from '../visuals/IndustrialStructure';
import { MachineDetail } from '../visuals/MachineDetail';
import { ROOM_COLORS } from './BaseMap';
import { AstronautModel } from '../characters/AstronautModel';
import { groundReady, canonicalPosition, nearbyLandmarks } from './planet';
import { meshGroundHeight } from './fixtures';
import { ownedPlots } from '../game/worldConfig';
import { CrewActors } from '../characters/CrewActors';
import { makeFixtures, type Fixture } from './fixtures';
import { CELL, FLOOR, cellKey, cellAt, roomAt, inAirlock, doorIsOpen, type Layout, type Room, type Door, type Point } from './layout';

export function Solid({p,size,color='#d8d5c7',texture,children}:{p:Point;size:Point;color?:string;texture?:THREE.Texture;children?:ReactNode}){
 return <RigidBody type="fixed" colliders={false} position={p}><CuboidCollider args={[size[0]/2,size[1]/2,size[2]/2]}/><mesh castShadow receiveShadow><boxGeometry args={size}/><meshStandardMaterial color={color} map={texture} roughness={.78} metalness={.25}/></mesh>{children}</RigidBody>
}
function Label({text,p,width=2,color='#b8e5dd',rotation=[0,0,0]}:{text:string;p:Point;width?:number;color?:string;rotation?:Point}){
 const texture=useMemo(()=>{const c=document.createElement('canvas');c.width=1024;c.height=192;const ctx=c.getContext('2d')!;ctx.fillStyle='#080d17';ctx.fillRect(0,0,1024,192);ctx.strokeStyle=color;ctx.lineWidth=5;ctx.strokeRect(8,8,1008,176);ctx.fillStyle=color;ctx.font='500 50px Inter,Segoe UI,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,512,96,960);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t},[text,color]);
 useEffect(()=>()=>texture.dispose(),[texture]);return <mesh position={p} rotation={rotation}><planeGeometry args={[width,width*192/1024]}/><meshBasicMaterial map={texture} side={THREE.DoubleSide}/></mesh>
}
function Target({data,children}:{data:Interaction;children:ReactNode}){
 const group=useRef<THREE.Group>(null),target=useExplorer(s=>s.target);
 useEffect(()=>{group.current?.traverse(obj=>{if(obj instanceof THREE.Mesh&&!Array.isArray(obj.material)&&obj.material instanceof THREE.MeshStandardMaterial){obj.material.emissive.set(target?.id===data.id?'#173623':'#000000');obj.material.emissiveIntensity=.25}})},[target?.id,data.id]);
 return <group ref={group} userData={{interaction:data}}>{children}</group>
}
function Equipment({f,r}:{f:Fixture;r:Room}){
 const [w,h,d]=f.size;
 const data:Interaction|undefined=f.type==='terminal'?{type:'terminal',id:r.buildingId,label:`Use ${r.name.toLowerCase()}`}:
 f.type==='suit'?{type:'suit',id:f.id,label:'Equip / stow spacesuit'}:f.type==='shelf'?{type:'storage',id:r.buildingId,label:'Open supply storage'}:f.type==='bunk'?undefined:{type:'terminal',id:r.buildingId,label:`Use ${r.name.toLowerCase()}`};
 const geometry=<group>
  {['terminal','rack','tank','bench','cabinet'].includes(f.type)?<MachineDetail fixture={f} room={r}/>:f.type==='suit'?<>
   <mesh position={[0,h/2,-d/2+.2]} castShadow><boxGeometry args={[w,h,.35]}/><meshStandardMaterial color={C.panel} metalness={.35} roughness={.6}/></mesh>
   <AstronautModel height={1.86} animated={false}/><Label text="EVA SUIT" p={[0,2.1,.15]} width={1.1}/>
  </>:f.type==='bunk'?<>
   {[.65,1.7].map(y=><group key={y}><mesh position={[0,y,0]} castShadow><boxGeometry args={[w,.16,d]}/><meshStandardMaterial color={C.burgundy} metalness={.3} roughness={.7}/></mesh><mesh position={[0,y+.14,0]}><boxGeometry args={[w-.2,.15,d-.2]}/><meshStandardMaterial color={C.cable} roughness={.95}/></mesh><mesh position={[0,y+.26,-1.1]}><boxGeometry args={[w-.35,.2,.55]}/><meshStandardMaterial color={C.hull} roughness={1}/></mesh><mesh position={[0,y+.26,.2]}><boxGeometry args={[w-.3,.08,1.55]}/><meshStandardMaterial color={C.burgundy} roughness={1}/></mesh></group>)}
  </>:f.type==='planter'?<>
   <mesh position={[0,.55,0]} castShadow><boxGeometry args={[w,1.1,d]}/><meshStandardMaterial color={C.dark} roughness={.8}/></mesh>
   {Array.from({length:8},(_,i)=><mesh key={i} position={[(i%2-.5)*.8,1.3,(Math.floor(i/2)-1.5)*1.1]} castShadow><icosahedronGeometry args={[.55,1]}/><meshStandardMaterial color={i%2?'#598359':'#375a44'}/></mesh>)}
  </>:f.type==='bed'?<>
   <mesh position={[0,.7,0]} castShadow><boxGeometry args={[w,1.4,d]}/><meshStandardMaterial color={C.panel} roughness={.7}/></mesh>
   <mesh position={[0,1.45,0]}><boxGeometry args={[w-.2,.15,d-.2]}/><meshStandardMaterial color={C.cable} roughness={.9}/></mesh>
  </>:f.type==='shelf'?<>
   {[.4,1.2,2].map(y=><mesh key={y} position={[0,y,0]} castShadow><boxGeometry args={[w,.65,d]}/><meshStandardMaterial color={y===1.2?C.burgundy:C.panel} roughness={.8}/></mesh>)}
  </>:<>
   <mesh position={[0,h/2,0]} castShadow><boxGeometry args={[w,h,d]}/><meshStandardMaterial color={f.type==='rack'?'#3c5260':'#c2c2b4'} roughness={.65} metalness={.35}/></mesh>
   {f.type==='rack'&&[.5,1.15,1.8].map(y=><mesh key={y} position={[0,y,d/2+.015]}><boxGeometry args={[w-.2,.23,.03]}/><meshStandardMaterial color="#82b9b0" emissive="#477c71" emissiveIntensity={.4}/></mesh>)}
  </>}
 </group>;
 return <RigidBody type="fixed" colliders={false} position={f.position} rotation={[0,f.rotation,0]}>
  <CuboidCollider position={[0,f.type==='terminal'?1.45:h/2,0]} args={[w/2,f.type==='terminal'?.35:h/2,d/2]}/>
  {data?<Target data={data}>{geometry}</Target>:geometry}
 </RigidBody>;
}
function SlidingDoor({d}:{d:Door}){
 const opened=useExplorer(s=>doorIsOpen(d,s.doors)),panel=useRef<THREE.Mesh>(null);
 useFrame((_,dt)=>{if(panel.current)panel.current.position.y=THREE.MathUtils.damp(panel.current.position.y,opened?4.9:FLOOR+1.5,9,dt)});
 const size:Point=d.axis==='z'?[3,3,.2]:[.2,3,3];
 return <Target data={{type:'door',id:d.id,label:d.airlock?`${opened?'Close':'Open'} ${d.airlock} airlock door`:`${opened?'Close':'Open'} corridor door`}}>
 <Bulkhead position={[d.x,FLOOR,d.z]} rotation={[0,d.axis==='x'?Math.PI/2:0,0]}/>
 <RigidBody type="fixed" colliders={false}>{!opened&&<CuboidCollider position={[d.x,FLOOR+1.5,d.z]} args={[size[0]/2,size[1]/2,size[2]/2]}/>}</RigidBody>
 <mesh ref={panel} visible={!opened} position={[d.x,opened?4.9:FLOOR+1.5,d.z]} castShadow><boxGeometry args={size}/><meshStandardMaterial color={d.airlock?C.burgundy:C.panel} roughness={.55} metalness={.45}/></mesh>
 <mesh position={[d.x+(d.axis==='x'?.12:0),FLOOR+1.3,d.z+(d.axis==='z'?.12:0)]} rotation={[0,d.axis==='x'?Math.PI/2:0,0]}><boxGeometry args={[.28,.45,.08]}/><meshStandardMaterial color={opened?'#9bd6b1':'#dfb270'} emissive={opened?'#588b6a':'#7d5e34'}/></mesh>
 <Label text={d.airlock?`${d.airlock.toUpperCase()} AIRLOCK`:opened?'OPEN':'E · DOOR'} p={[d.x,FLOOR+2.7,d.z+(d.axis==='z'?.14:0)]} rotation={[0,d.axis==='x'?Math.PI/2:0,0]} width={2}/>
 </Target>
}
function RoomLighting({r}:{r:Room}){
 const night=useCrewLife(s=>nightShift(s.seconds)),sleepingRoom=night&&r.kind==='habitat';
 return <><mesh position={[r.x*CELL,FLOOR+3.17,r.z*CELL]} rotation={[Math.PI/2,0,0]}><planeGeometry args={[2.15,.14]}/><meshBasicMaterial color={sleepingRoom?'#6b7eaa':r.kind==='greenhouse'?'#9caed7':'#c3cae1'} side={THREE.DoubleSide}/></mesh><pointLight position={[r.x*CELL,FLOOR+2.8,r.z*CELL]} intensity={sleepingRoom?16:48} distance={(r.radius+1)*CELL*1.5} decay={2} color={sleepingRoom?'#8a9fcf':r.kind==='habitat'?'#b9c8e8':r.kind==='greenhouse'?'#93a9d5':'#c7d1f0'}/></>;
}
export function Base({layout:l}:{layout:Layout}){
 const relayOnline=useGame(s=>s.flags.includes('eva-relay-repaired')),pressure=useExplorer(s=>s.pressure);
 const fixtures=useMemo(()=>makeFixtures(l),[l]);

 const floorMap=useMemo(()=>panelTexture(true),[]),wallMap=useMemo(()=>panelTexture(false),[]);
 useEffect(()=>()=>{floorMap.dispose();wallMap.dispose()},[floorMap,wallMap]);
 return <>
 <IndustrialStructure layout={l}/>
 {[...l.cells].map(k=>{const [ix,iz]=k.split(',').map(Number),x=ix*CELL,z=iz*CELL,room=roomAt(l,[x,0,z]);return <group key={k}>
 <Solid p={[x,FLOOR-.18,z]} size={[3,.36,3]} color="#c4c7d3" texture={floorMap}/>
 <Solid p={[x,FLOOR+3.3,z]} size={[3,.2,3]} color={C.dark}/>
 {[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dz])=>{if(l.cells.has(cellKey(ix+dx,iz+dz)))return null;const outer=Math.abs(x-l.airlock.x)<.1&&Math.abs(z+dz*1.5-l.airlock.outerZ)<.1;if(outer)return null;return <group key={`${dx}-${dz}`}>
 <Solid p={[x+dx*1.5,FLOOR+1.6,z+dz*1.5]} size={dx?[.22,3.2,3]:[3,3.2,.22]} color="#d0d3df" texture={wallMap}/>
 <mesh position={[x+dx*1.37,FLOOR+1.6,z+dz*1.37]} rotation={[0,dx?Math.PI/2:0,0]}><planeGeometry args={[1.8,.75]}/><meshStandardMaterial color="#171f36" metalness={.65} roughness={.15}/></mesh>
 <Solid p={[x+dx*1.38,FLOOR+.35,z+dz*1.38]} size={dx?[.06,.12,3]:[3,.12,.06]} color={C.burgundy}/>
 <mesh position={[x+dx*1.36,FLOOR+2.9,z+dz*1.36]}><boxGeometry args={dx?[.06,.07,2.5]:[2.5,.07,.06]}/><meshBasicMaterial color="#7981a0"/></mesh>
 {[-1,1].map(side=><mesh key={side} position={[x+dx*1.36+(dx?0:side*1.4),FLOOR+1.65,z+dz*1.36+(dz?0:side*1.4)]} castShadow><boxGeometry args={dx?[.12,3,.12]:[.12,3,.12]}/><meshStandardMaterial color={C.burgundy} metalness={.65} roughness={.45}/></mesh>)}
 </group>})}
 {!room&&<mesh position={[x,FLOOR+3.15,z]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[.3,2]}/><meshBasicMaterial color="#abb6d3" side={THREE.DoubleSide}/></mesh>}
 </group>})}
 {fixtures.map(f=><Equipment key={f.id} f={f} r={l.rooms.find(r=>r.id===f.roomId)!}/>)}
 {l.rooms.map(r=><group key={r.id}>
 <RoomLighting r={r}/>
 <Label text={r.name} p={[r.x*CELL,FLOOR+2.7,(r.z-r.radius)*CELL+.12]} width={3} color={ROOM_COLORS[r.kind]}/>
 </group>)}{l.doors.map(d=><SlidingDoor key={d.id} d={d}/>)}
 <Target data={{type:'cycle',id:'airlock-cycle',label:pressure>.5?'Depressurize airlock':'Pressurize airlock'}}><Solid p={[l.airlock.x-1.25,FLOOR+1.4,l.airlock.centerZ]} size={[.2,.8,.7]} color={C.panel}/><Label text={pressure>.5?'PRESSURIZED':'VACUUM'} p={[l.airlock.x-1.1,FLOOR+2,l.airlock.centerZ]} rotation={[0,Math.PI/2,0]} width={1.8}/></Target>
 <pointLight position={[l.airlock.x,FLOOR+2.5,l.airlock.centerZ]} intensity={12} distance={9} color={pressure>.5?C.green:C.yellow}/>
 <Target data={{type:'relay',id:'external-relay',label:'Repair external power relay'}}><Solid p={[l.relay[0],FLOOR+.9,l.relay[2]]} size={[1.4,1.8,1.1]} color={C.panel}/><Label text={relayOnline?'RELAY ONLINE':'RELAY FAULT'} p={[l.relay[0],FLOOR+1.35,l.relay[2]+.57]} width={1.2} color={relayOnline?'#9bd9ba':'#efb07b'}/><mesh position={[l.relay[0],FLOOR+2,l.relay[2]]}><sphereGeometry args={[.12,10,8]}/><meshBasicMaterial color={relayOnline?'#8be2b9':'#f1a36d'}/></mesh></Target>
 <Label text="EXTERNAL RELAY →" p={[l.airlock.x,FLOOR+2,l.airlock.outerZ+.3]} width={2.8}/>
 <CrewActors layout={l} fixtures={fixtures}/>
 </>
}
export function Astronaut({layout:l}:{layout:Layout}){
 const {camera,scene}=useThree(),{world}=useRapier(),body=useRef<RapierRigidBody>(null),collider=useRef<RapierCollider>(null);
 const vertical=useRef(0),speed=useRef(new THREE.Vector3()),elapsed=useRef(0),sample=useRef(0),motion=useRef({moving:false,sprinting:false});
 const expanded=useGame(s=>s.expandedPlots),plots=useMemo(()=>ownedPlots(expanded),[expanded]),relocation=useExplorer(s=>s.relocation);
 const controller=useRef<ReturnType<ReturnType<typeof useRapier>['world']['createCharacterController']>|null>(null);
 const ray=useMemo(()=>new THREE.Raycaster(),[]),forward=useMemo(()=>new THREE.Vector3(),[]),supportCache=useRef<{state:unknown;safe:boolean}>({state:null,safe:true});
 useEffect(()=>{const c=createWalker(world);controller.current=c;return()=>{controller.current=null;world.removeCharacterController(c)}},[world]);
 useEffect(()=>{
  const s=useExplorer.getState(),start=s.locationSaved?s.position:l.spawn;
  body.current?.setTranslation({x:start[0],y:start[1],z:start[2]},true);body.current?.setNextKinematicTranslation({x:start[0],y:start[1],z:start[2]});
  camera.rotation.set(0,s.locationSaved?-s.heading:Math.PI,0);vertical.current=0;speed.current.set(0,0,0);
  useExplorer.setState({position:start,ready:true});
 },[camera,l,relocation]);
 useEffect(()=>{
  const down=(event:KeyboardEvent)=>{
   if(useTrainingUI.getState().open)return;
   if(event.target instanceof HTMLElement&&(event.target.closest('input,select,textarea')||event.target.isContentEditable))return;
   const s=useExplorer.getState();
   if(MOVEMENT_CODES.has(event.code)){if(!s.locked||s.panel)return;event.preventDefault();heldKeys.add(event.code)}
   if(event.code==='KeyM'&&!event.repeat&&!s.panel){event.preventDefault();useExplorer.setState({mapExpanded:!s.mapExpanded})}
   if(event.code==='KeyG'&&!event.repeat){event.preventDefault();s.open(s.panel?.type==='planet'?null:{type:'planet'})}
   if(event.code==='Tab'){event.preventDefault();s.open({type:'tablet'})}
   if(event.code!=='KeyE'||event.repeat||!s.locked)return;
   event.preventDefault();if(s.activeRover){useExplorer.setState({exitRequested:true});return;}
   const t=s.target;if(!t)return;
   if(t.type==='rover')s.boardRover(t.id);
   else if(t.type==='door'){const d=l.doors.find(d=>d.id===t.id);if(d)s.door(d)}
   else if(t.type==='cycle')s.cycleAirlock(l);
   else if(t.type==='suit'){s.suit();s.refill()}
   else if(t.type==='relay')s.open({type:'repair',id:t.id});
   else if(t.type==='crew')s.open({type:'crew',id:t.id});
   else s.open({type:'terminal',id:t.id});
  };
  const up=(event:KeyboardEvent)=>heldKeys.delete(event.code),clear=()=>heldKeys.clear();
  document.addEventListener('keydown',down);document.addEventListener('keyup',up);document.addEventListener('pointerlockchange',clear);window.addEventListener('blur',clear);
  return()=>{clear();document.removeEventListener('keydown',down);document.removeEventListener('keyup',up);document.removeEventListener('pointerlockchange',clear);window.removeEventListener('blur',clear);useExplorer.setState({ready:false})};
 },[l]);
 useBeforePhysicsStep(()=>{
  const b=body.current,c=collider.current,walker=controller.current;if(!b||!c||!walker)return;
  const s=useExplorer.getState(),g=useGame.getState(),crew=g.astronauts.find(c=>c.id===s.playerId);c.setEnabled(!s.activeRover);
  if(s.activeRover||!s.locked||s.panel||!crew?.alive){speed.current.set(0,0,0);motion.current={moving:false,sprinting:false};return;}
  const p=b.translation();if(!groundReady(world,p.x,p.z,1)){b.setNextKinematicTranslation(p);vertical.current=0;return;}
  const dt=1/60;camera.getWorldDirection(forward);const move=movementInput(heldKeys,forward),moving=move.lengthSq()>0,sprinting=moving&&(heldKeys.has('ShiftLeft')||heldKeys.has('ShiftRight'));
  move.multiplyScalar(sprinting?9:3);speed.current.lerp(move,1-Math.exp(-dt*12));vertical.current=walker.computedGrounded()?-.2:Math.max(-20,vertical.current-3.71*dt);
  walker.computeColliderMovement(c,{x:speed.current.x*dt,y:vertical.current*dt,z:speed.current.z*dt});const delta=walker.computedMovement();
  b.setNextKinematicTranslation({x:p.x+delta.x,y:p.y+delta.y,z:p.z+delta.z});motion.current={moving,sprinting};
 });
 useFrame((_,delta)=>{
  if(!body.current)return;const s=useExplorer.getState(),g=useGame.getState(),driving=!!s.activeRover;
  let pos:Point=s.position;
  if(!driving){
   let p=body.current.translation(),canonical=canonicalPosition(p.x,p.z);
   if(![p.x,p.y,p.z].every(Number.isFinite)){p={x:l.spawn[0],y:l.spawn[1],z:l.spawn[2]};body.current.setTranslation(p,true)}
   if(Math.abs(canonical.x-p.x)>100||Math.abs(canonical.z-p.z)>100){
    p={x:canonical.x,y:meshGroundHeight(l,canonical.x,canonical.z,plots)+1,z:canonical.z};body.current.setTranslation(p,true);body.current.setNextKinematicTranslation(p);vertical.current=0;
    if(canonical.poleFlipped)camera.rotation.y=-Math.PI-camera.rotation.y;
   }
   if(p.y<meshGroundHeight(l,p.x,p.z,plots)-25){p={x:p.x,y:meshGroundHeight(l,p.x,p.z,plots)+1,z:p.z};body.current.setTranslation(p,true);body.current.setNextKinematicTranslation(p);vertical.current=0;}
   pos=[p.x,p.y,p.z];camera.position.set(p.x,p.y+.7,p.z);sample.current+=delta;
   if(sample.current>.15){camera.getWorldDirection(forward);useExplorer.setState({position:pos,heading:Math.atan2(forward.x,-forward.z),locationSaved:true,visited:[...new Set([...s.visited,...nearbyLandmarks(p.x,p.z).map(site=>site.id)])]});sample.current=0;}
  }
  if(!s.locked||s.panel||useTrainingUI.getState().open)return;
  if(supportCache.current.state!==g)supportCache.current={state:g,safe:!commissioningComplete(g)||calculateSupport(g)};
  const safe=driving||(inAirlock(l,pos)?s.pressure>.99:l.cells.has(cellAt(pos))&&supportCache.current.safe),dt=Math.min(.1,delta);
  s.tick(dt,!safe,motion.current.sprinting);elapsed.current+=dt;
  if(elapsed.current>=1){g.evaTick(s.playerId,elapsed.current,safe,s.suited,s.oxygen,motion.current.moving,motion.current.sprinting);elapsed.current=0;}
  if(driving)return;
  ray.setFromCamera(new THREE.Vector2(0,0),camera);ray.far=3.4;let target:Interaction|null=null;
  for(const hit of ray.intersectObjects(scene.children,true)){
   if(!(hit.object instanceof THREE.Mesh)||!hit.object.visible)continue;
   let obj:THREE.Object3D|null=hit.object;while(obj){if(obj.userData.interaction){target=obj.userData.interaction;break}obj=obj.parent}break;
  }
  if(s.target?.id!==target?.id||s.target?.label!==target?.label)useExplorer.setState({target});
 });
 return <><RigidBody ref={body} type="kinematicPosition" colliders={false} position={l.spawn} enabledRotations={[false,false,false]} ccd><CapsuleCollider ref={collider} args={[.55,.35]}/></RigidBody><MouseLookControls/></>;
}
function calculateSupport(g:ReturnType<typeof useGame.getState>){const r=calculateOperations(simulationSnapshot(g)).report;return r.safeHabitat&&r.co2Removal&&g.systems.co2Percent<.8}
