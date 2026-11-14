import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, CuboidCollider, useBeforePhysicsStep, useRapier, type RapierRigidBody, type RapierCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { useExplorer } from './store';
import { useGame } from '../store/game';
import { ownedPlots } from '../game/worldConfig';
import { heldKeys, createWalker } from './movement';
import { groundReady, canonicalPosition, nearbyLandmarks, LANDMARKS, surfaceDistance } from './planet';
import { meshGroundHeight } from './fixtures';
import { driveStep, exitCandidates, type RoverState } from './roverPhysics';
import type { Layout } from './layout';
import { INDUSTRIAL as C } from '../visuals/palette';
import { HazardStrip, Pipe, CRTMonitor } from '../visuals/IndustrialKit';

function RoverVehicle({rover,layout:l,preview}:{rover:RoverState;layout:Layout;preview:boolean}){
 const {world,rapier}=useRapier(),{camera}=useThree(),body=useRef<RapierRigidBody>(null),collider=useRef<RapierCollider>(null);
 const active=useExplorer(s=>s.activeRover===rover.id),initial=useRef(rover.position),wheelGroups=useRef<(THREE.Group|null)[]>([]),visual=useRef<THREE.Group>(null);
 const telemetry=useRef(0),motion=useRef({speed:0,heading:rover.heading,battery:rover.battery,odometer:rover.odometer,vertical:0,steer:0,spin:0});
 const plots=useGame(s=>s.expandedPlots),terrainPlots=useMemo(()=>ownedPlots(plots),[plots]);
 const controller=useRef<ReturnType<ReturnType<typeof useRapier>['world']['createCharacterController']>|null>(null);
 useEffect(()=>{const c=createWalker(world);c.enableAutostep(.45,.7,true);c.enableSnapToGround(.8);controller.current=c;return()=>{controller.current=null;world.removeCharacterController(c)}},[world]);
 useEffect(()=>{if(active&&!preview){motion.current.speed=0;camera.rotation.set(-.24,-motion.current.heading,0)}},[active,preview,camera]);
 const capsule=useMemo(()=>new rapier.Capsule(.55,.35),[rapier]);
 useBeforePhysicsStep(()=>{
  const b=body.current,c=collider.current,walker=controller.current,s=useExplorer.getState(),m=motion.current;
  if(!b||!c||!walker||preview)return;
  const driving=s.activeRover===rover.id;
  if(!driving||!s.locked||s.panel){m.speed=0;return;}
  let p=b.translation();if(!groundReady(world,p.x,p.z,4)){b.setNextKinematicTranslation(p);return;}
  const ground=meshGroundHeight(l,p.x,p.z,terrainPlots);
  if(!Number.isFinite(p.y)||p.y<ground-5){p={x:p.x,y:ground+1.1,z:p.z};b.setTranslation(p,true);b.setNextKinematicTranslation(p);m.vertical=0;}
  if(s.exitRequested){
   useExplorer.setState({exitRequested:false});
   if(Math.abs(m.speed)>1.5){s.notify('Hold Space to stop before exiting.');return;}
   if(!s.suited||s.oxygen<5){s.notify('A charged EVA suit is required to leave the pressurized cabin. Return to base or deploy with a refilled suit.');return;}
   const candidates=exitCandidates({...rover,position:[p.x,p.y,p.z],heading:m.heading},(x,z)=>meshGroundHeight(l,x,z,terrainPlots));
   const exit=candidates.find(pos=>{if(!groundReady(world,pos[0],pos[2],1))return false;let blocked=false;world.intersectionsWithShape({x:pos[0],y:pos[1],z:pos[2]},{x:0,y:0,z:0,w:1},capsule,()=>{blocked=true;return false});return !blocked});
   if(!exit){s.notify('No clear space beside the rover. Move to open ground.');return;}
   useExplorer.setState({activeRover:null,position:exit,heading:m.heading,relocation:s.relocation+1,notice:'EVA active · E to enter the rover again',locationSaved:true});return;
  }
  const dt=1/60,k=heldKeys,throttle=(k.has('KeyW')||k.has('ArrowUp')?1:0)-(k.has('KeyS')||k.has('ArrowDown')?1:0),steer=(k.has('KeyD')||k.has('ArrowRight')?1:0)-(k.has('KeyA')||k.has('ArrowLeft')?1:0);
  const next=driveStep(m.speed,m.heading,{throttle,steer,brake:k.has('Space'),boost:k.has('ShiftLeft')||k.has('ShiftRight'),battery:m.battery},dt),turn=next.heading-m.heading;
  m.heading=next.heading;m.steer=steer;m.speed=next.speed;m.battery=next.battery;
  if((Math.hypot(p.x,p.z)<85||LANDMARKS.some(site=>site.kind==='outpost'&&surfaceDistance({x:p.x,z:p.z},site)<18))&&Math.abs(m.speed)<.2)m.battery=Math.min(100,m.battery+dt*.5);
  m.vertical=walker.computedGrounded()?-.3:Math.max(-20,m.vertical-3.71*dt);
  b.setRotation({x:0,y:Math.sin(m.heading/2),z:0,w:Math.cos(m.heading/2)},true);
  walker.computeColliderMovement(c,{x:Math.sin(m.heading)*m.speed*dt,y:m.vertical*dt,z:-Math.cos(m.heading)*m.speed*dt});
  const delta=walker.computedMovement(),travel=Math.hypot(delta.x,delta.z);m.odometer+=travel;m.spin+=Math.sign(m.speed)*travel/.58;
  if(Math.abs(m.speed)>1&&travel<Math.abs(m.speed)*dt*.15)m.speed*=.3;
  let nextPosition={x:p.x+delta.x,y:p.y+delta.y,z:p.z+delta.z};
  const canonical=canonicalPosition(nextPosition.x,nextPosition.z);
  if(Math.abs(canonical.x-nextPosition.x)>100||Math.abs(canonical.z-nextPosition.z)>100){
   nextPosition={x:canonical.x,y:meshGroundHeight(l,canonical.x,canonical.z,terrainPlots)+1.1,z:canonical.z};
   if(canonical.poleFlipped)m.heading=Math.PI-m.heading;
   b.setTranslation(nextPosition,true);m.vertical=0;camera.rotation.y=-m.heading;
   useExplorer.setState({position:[nextPosition.x,nextPosition.y,nextPosition.z]});
  }else camera.rotation.y-=turn;
  b.setNextKinematicTranslation(nextPosition);
 });
 const cameraDirection=useMemo(()=>new THREE.Vector3(),[]);
 useFrame((_,dt)=>{
  const b=body.current,m=motion.current;if(!b)return;const p=b.translation();
  wheelGroups.current.forEach((wheel,i)=>{if(wheel){wheel.rotation.x=m.spin;wheel.rotation.y=i<2?m.steer*.35:0}});
  if(active&&!preview){
   camera.getWorldDirection(cameraDirection);cameraDirection.y=0;cameraDirection.normalize();
   const x=p.x-cameraDirection.x*8,z=p.z-cameraDirection.z*8;
   camera.position.set(x,Math.max(p.y+3.1,meshGroundHeight(l,x,z,terrainPlots)+2),z);
   telemetry.current+=dt;
   if(telemetry.current>.12){const s=useExplorer.getState(),visited=[...new Set([...s.visited,...nearbyLandmarks(p.x,p.z).map(site=>site.id)])];
    useExplorer.setState({position:[p.x,p.y,p.z],heading:m.heading,locationSaved:true,visited,rovers:s.rovers.map(r=>r.id===rover.id?{...r,position:[p.x,p.y,p.z],heading:m.heading,speed:m.speed,battery:m.battery,odometer:m.odometer}:r)});telemetry.current=0;}
  }
  if(visual.current){const forward={x:Math.sin(m.heading)*1.5,z:-Math.cos(m.heading)*1.5};
   const front=meshGroundHeight(l,p.x+forward.x,p.z+forward.z,terrainPlots),back=meshGroundHeight(l,p.x-forward.x,p.z-forward.z,terrainPlots);
   visual.current.rotation.x=THREE.MathUtils.damp(visual.current.rotation.x,Math.atan2(front-back,3),5,dt);
  }
 });
 return <RigidBody ref={body} type="kinematicPosition" colliders={false} position={initial.current} rotation={[0,rover.heading,0]} enabledRotations={[false,true,false]} ccd>
  <CuboidCollider ref={collider} position={[0,-.25,0]} args={[1.5,.8,1.95]}/>
  <group ref={visual} userData={{interaction:{type:'rover',id:rover.id,label:`Enter ${rover.name} rover · pressurized cabin`}}}>
   <mesh castShadow receiveShadow><boxGeometry args={[2.35,.8,3.8]}/><meshStandardMaterial color={C.panel} metalness={.4} roughness={.65}/></mesh>
   <mesh position={[0,.9,-.35]} castShadow><boxGeometry args={[2.15,1.45,2.4]}/><meshStandardMaterial color={C.hull} metalness={.3} roughness={.65}/></mesh>
   <mesh position={[0,1.02,-1.57]} rotation={[-.1,0,0]}><boxGeometry args={[1.85,.85,.05]}/><meshPhysicalMaterial color="#101a31" metalness={.65} roughness={.14} clearcoat={1}/></mesh>
   {[-1,1].map(side=><group key={side}><mesh position={[side*1.09,1,-.35]}><boxGeometry args={[.04,.8,1.8]}/><meshPhysicalMaterial color="#17213c" roughness={.18} metalness={.6} clearcoat={1}/></mesh><mesh position={[side*1.2,.15,0]}><boxGeometry args={[.08,.14,3.6]}/><meshStandardMaterial color={rover.id==='rover-0'?C.burgundy:C.cable} roughness={.65}/></mesh><mesh position={[side*.8,.25,-1.95]}><boxGeometry args={[.42,.18,.06]}/><meshStandardMaterial color="#e4eed9" emissive="#bccdb7" emissiveIntensity={1.5}/></mesh></group>)}
   {[[-1.48,-1.25],[1.48,-1.25],[-1.48,1.25],[1.48,1.25]].map(([x,z],i)=><group ref={r=>{wheelGroups.current[i]=r}} key={i} position={[x,-.5,z]}><mesh rotation={[0,0,Math.PI/2]} castShadow><cylinderGeometry args={[.58,.58,.36,24]}/><meshStandardMaterial color="#323a39" roughness={.98}/></mesh><mesh position={[Math.sign(x)*.2,0,0]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.32,.32,.035,16]}/><meshStandardMaterial color={C.steel} metalness={.65} roughness={.4}/></mesh></group>)}
   <mesh position={[0,1.68,.1]}><boxGeometry args={[1.8,.08,1.6]}/><meshStandardMaterial color="#243151" roughness={.5} metalness={.25}/></mesh>
   <mesh position={[.85,2,1.2]}><cylinderGeometry args={[.02,.02,1.1,8]}/><meshStandardMaterial color="#8da7a6" metalness={.7}/></mesh>
   <HazardStrip position={[0,-.18,-1.94]} size={[2.2,.12,.025]}/>
   <group position={[0,.12,1.915]} scale={[1,1,.2]}><CRTMonitor title={rover.name.toUpperCase()+' / ROVER'} status={active?'ONLINE':'STANDBY'} lines={[`BATTERY ${rover.battery.toFixed(0)} %`,`SPEED ${(Math.abs(rover.speed)*3.6).toFixed(0)} km/h`,`RANGE ${(rover.odometer/1000).toFixed(2)} km`,'CABIN / PRESSURIZED']} width={.8} height={.5}/></group>
   {[-1,1].map(side=><Pipe key={side} points={[[side*.85,1.8,-.85],[side*.85,1.8,1],[side*.85,.5,1.4]]} radius={.045} color={C.burgundy}/>)}
   <mesh position={[0,.1,2]}><boxGeometry args={[2.1,.15,.2]}/><meshStandardMaterial color={C.burgundy} metalness={.6}/></mesh>
  </group>
 </RigidBody>;
}
export function RoverFleet({layout,preview=false}:{layout:Layout;preview?:boolean}){
 const rovers=useExplorer(s=>s.rovers);
 useEffect(()=>useExplorer.getState().initRovers(layout),[layout]);
 return <>{rovers.map(r=><RoverVehicle key={r.id} rover={r} layout={layout} preview={preview}/>)}</>;
}
