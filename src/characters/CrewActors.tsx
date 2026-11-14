import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AstronautModel, type AstronautMotion } from './AstronautModel';
import { useGame } from '../store/game';
import { useExplorer } from '../explorer/store';
import { useTrainingUI } from '../training/ui';
import { FLOOR, type Layout } from '../explorer/layout';
import type { Fixture } from '../explorer/fixtures';
import { clearFloor, crewBerths, makeCrewNavigation, nearestNode, roomDestination } from './crewNavigation';
import { activityLabel, createCrewAgent, stepCrew, type CrewAgent } from './crewRoutine';
import { useCrewLife, type CrewPresence } from './crewStore';
import type { CrewMember } from '../simulation/types';
function CrewActor({crew,agent,index}:{crew:CrewMember;agent:CrewAgent;index:number}){
 const root=useRef<THREE.Group>(null),pose=useRef<THREE.Group>(null),label=useRef<THREE.Sprite>(null),motion=useRef<AstronautMotion>({speed:0,sleeping:false}),yaw=useRef(agent.heading);
 const presence=useCrewLife(s=>s.members[crew.id]);
 const text=`${crew.name.split(' ')[0]} · ${presence?activityLabel(presence):crew.role}`;
 const texture=useMemo(()=>{const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=128;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#080d17e8';ctx.fillRect(0,0,1024,128);ctx.strokeStyle=presence?.activity==='sleeping'?'#8c9bd0':'#98b99c';ctx.lineWidth=4;ctx.strokeRect(4,4,1016,120);ctx.font='26px Menlo,monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#c5e2bc';ctx.fillText(text,512,64,985);const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;return t},[text,presence?.activity]);
 useEffect(()=>()=>texture.dispose(),[texture]);
 useFrame((_,dt)=>{
  if(!root.current||!pose.current)return;
  const b=agent.berth,blend=agent.blend,x=agent.position.x,z=agent.position.z;
  root.current.position.set(b?THREE.MathUtils.lerp(x,b.position[0],blend):x,b?THREE.MathUtils.lerp(FLOOR,b.position[1],blend):FLOOR,b?THREE.MathUtils.lerp(z,b.position[2],blend):z);
  const target=blend>.01&&b?b.heading:agent.heading;
  yaw.current+=Math.atan2(Math.sin(target-yaw.current),Math.cos(target-yaw.current))*(1-Math.exp(-Math.min(dt,.1)*8));root.current.rotation.y=yaw.current;
  pose.current.rotation.x=-Math.PI/2*blend;
  motion.current.speed=agent.speed;motion.current.sleeping=blend>.05;
  root.current.userData.interaction.label=agent.activity==='sleeping'?`Check on ${crew.name.split(' ')[0]} · sleeping`:`Talk to ${crew.name.split(' ')[0]}`;
  if(label.current){label.current.position.y=blend>.05?.8:2.2;label.current.visible=agent.activity!=='walking'||Math.hypot(useExplorer.getState().position[0]-x,useExplorer.getState().position[2]-z)<12;}
 });
 return <group ref={root} position={[agent.position.x,FLOOR,agent.position.z]} userData={{interaction:{type:'crew',id:crew.id,label:`Talk to ${crew.name.split(' ')[0]}`}}}>
  {/* Crew yield to the player instead of adding solid corridor obstacles. */}
  <group ref={pose}><AstronautModel height={1.85} accent={['#d7bc69','#88b8c8','#99b78d','#c194a8'][index%4]} phase={index*2.1} attentive motion={motion}/></group>
  <sprite ref={label} position={[0,2.2,0]} scale={[3.1,.39,1]}><spriteMaterial map={texture} depthTest transparent/></sprite>
 </group>;
}
export function CrewActors({layout:l,fixtures}:{layout:Layout;fixtures:Fixture[]}){
 const crew=useGame(s=>s.astronauts),playerId=useExplorer(s=>s.playerId);
 const nav=useMemo(()=>makeCrewNavigation(l,fixtures),[l,fixtures]),berths=useMemo(()=>crewBerths(nav),[nav]);
 const signature=crew.filter(c=>c.alive&&c.id!==playerId).map(c=>c.id).join('|');
 const agents=useMemo(()=>{const saved=useCrewLife.getState().members;const result=new Map<string,CrewAgent>();
  crew.filter(c=>c.alive).forEach((c,i)=>{if(c.id===playerId)return;const berth=berths[i]??null,p=saved[c.id],fallback=berth?.approach??roomDestination(nav,l.habitat,i),position=p&&clearFloor(l,fixtures,p)?p:fallback;
   const a=createCrewAgent(c.id,nearestNode(nav,position)??fallback,berth);if(p?.berthId===berth?.id){a.blend=p?.blend??0;a.activity=p?.activity??'working';a.heading=p?.heading??0;}result.set(c.id,a);
  });return result;
 },[nav,berths,signature,playerId]);
 const clock=useRef(useCrewLife.getState().seconds),revision=useRef(useCrewLife.getState().revision),sample=useRef(0);
 useFrame((_,delta)=>{
  const e=useExplorer.getState(),g=useGame.getState(),state=useCrewLife.getState();
  if(state.revision!==revision.current){clock.current=state.seconds;revision.current=state.revision;}
  const active=e.locked&&!e.panel&&!useTrainingUI.getState().open&&!document.hidden&&g.status==='playing'&&!g.pendingEvent;
  if(!active){for(const a of agents.values())a.speed=0;return;}
  const dt=Math.min(.1,Math.max(0,delta));clock.current+=dt;sample.current+=dt;
  const members=g.astronauts.filter(c=>c.alive&&c.id!==e.playerId),shelter=g.effects.some(effect=>effect.shelter&&effect.untilSol>g.sol);
  members.forEach((c,i)=>{const a=agents.get(c.id);if(!a)return;const obstacles=[...agents.values()].filter(other=>other!==a&&other.blend===0).map(other=>other.position);
   if(e.position[1]<FLOOR+2&&e.position[1]>FLOOR-.5)obstacles.push({x:e.position[0],z:e.position[2]});
   const door=stepCrew(a,c,nav,clock.current,dt,i,obstacles,e.doors,shelter);
   if(door){const d=l.doors.find(d=>d.id===door);if(d&&!d.airlock)useExplorer.setState(s=>({doors:{...s.doors,[door]:true}}));}
  });
  if(sample.current>=.5){const snapshot:Record<string,CrewPresence>={};for(const a of agents.values())snapshot[a.id]={...a.position,activity:a.activity,destination:a.destination,heading:a.heading,blend:a.blend,berthId:a.berth?.id??null};state.publish(clock.current,snapshot);sample.current=0;}
 });
 return <>{crew.filter(c=>c.alive&&c.id!==playerId).map((c,i)=>{const a=agents.get(c.id);return a?<CrewActor key={c.id} crew={c} agent={a} index={i}/>:null})}</>;
}
