import { useShallow } from 'zustand/react/shallow';
import { useGame } from '../store/game';
import type { Fixture } from '../explorer/fixtures';
import type { Room } from '../explorer/layout';
import { INDUSTRIAL as C } from './palette';
import { CRTMonitor, HazardStrip, Pipe, Reactor } from './IndustrialKit';
import { facilityUnlocked,startupKind } from '../simulation/commissioning';
import { roomSuspended } from '../weather/incidents';

export function MachineDetail({fixture:f,room:r}:{fixture:Fixture;room:Room}){
 const g=useGame(useShallow(s=>({resources:s.resources,systems:s.systems,sol:s.sol,building:s.buildings.find(b=>b.id===r.buildingId),unlocked:facilityUnlocked(s,r.kind),suspended:r.kind!=='habitat'&&roomSuspended(s,startupKind(r.kind))}))),building=g.building,[w,h,d]=f.size,online=!!building?.active&&g.unlocked&&(building.damage??0)<80;
 const status=g.suspended?'MAINTENANCE LOCK':(building?.damage??0)>0?'FAULT':online?'ONLINE':'STANDBY';
 const lines=[`MODULE  ${r.buildingId.toUpperCase()}`,`POWER BUS   ${g.resources.power.toFixed(1)} kWh`,`OXYGEN      ${g.resources.oxygen.toFixed(2)} kg`,`WATER LOOP  ${g.systems.waterKg.toFixed(1)} kg`,`FOOD STORE  ${g.resources.food.toFixed(1)} kg`,`DAMAGE      ${(building?.damage??0).toFixed(0)} %`,`MISSION     SOL ${String(g.sol).padStart(3,'0')}`,online?'CONTROL BUS CONNECTED':'COMMISSIONING REQUIRED'];
 if(f.type==='terminal')return <>
  <mesh position={[0,1.1,-.08]} castShadow><boxGeometry args={[w,.18,.28]}/><meshStandardMaterial color={C.burgundy} metalness={.5} roughness={.7}/></mesh>
  <CRTMonitor title={r.name} status={status} lines={lines} schematic={r.kind==='research'||r.kind==='habitat'||r.kind==='water'} width={w} height={.79} position={[0,1.48,0]}/>
  <HazardStrip position={[0,.93,0]} size={[w,.065,.06]}/>
 </>;
 if(f.type==='rack')return <>
  <mesh position={[0,h/2,-d/2+.08]} castShadow><boxGeometry args={[w,h,.16]}/><meshStandardMaterial color={C.panel} metalness={.5} roughness={.7}/></mesh>
  <group position={[0,h/2,-.1]}><Reactor radius={Math.min(w/2-.15,h/2-.15)} depth={.55} active={online}/></group>
  <CRTMonitor title="POWER / DRIVE BUS" status={status} lines={lines.slice(1)} width={.75} height={.51} position={[-w*.27,h-.3,d/2-.14]}/>
  <HazardStrip position={[0,.13,d/2-.02]} size={[w,.1,.045]}/>
  {[-1,1].map(side=><Pipe key={side} points={[[side*(w/2-.05),.2,-d/2+.05],[side*(w/2-.05),h-.2,-d/2+.05],[side*(w/2-.25),h-.05,-d/2+.05]]} radius={.045} color={C.burgundy}/>)}
 </>;
 if(f.type==='tank')return <>
  <mesh position={[0,1.23,0]} castShadow><cylinderGeometry args={[.55,.55,2.3,16]}/><meshStandardMaterial color={C.hull} metalness={.5} roughness={.55}/></mesh>
  {[.35,1.2,2.12].map((y,i)=><mesh key={i} position={[0,y,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.57,.045,6,20]}/><meshStandardMaterial color={i===1?C.burgundy:C.steel} metalness={.55}/></mesh>)}
  <Pipe points={[[-.62,.15,.22],[-.62,2.3,.22],[-.35,2.4,.22]]} radius={.045} color={r.kind==='water'?C.cable:C.burgundy}/>
  <CRTMonitor title={r.kind==='water'?'H2O / RECLAIM':'O2 / PROCESS'} status={status} lines={lines.slice(1,7)} width={.75} height={.52} position={[0,1.45,d/2-.16]}/>
  <HazardStrip position={[0,.16,.56]} size={[1.1,.09,.04]}/>
 </>;
 if(f.type==='bench')return <>
  <mesh position={[0,.68,0]} castShadow><boxGeometry args={[w,1.36,d]}/><meshStandardMaterial color={C.panel} metalness={.4} roughness={.7}/></mesh>
  <mesh position={[0,1.39,0]} castShadow><boxGeometry args={[w+.02,.08,d]}/><meshStandardMaterial color={C.steel} metalness={.55} roughness={.5}/></mesh>
  <CRTMonitor title="LAB / SYSTEM TOPOLOGY" status={status} lines={lines} schematic width={w-.12} height={.62} position={[0,1.66,d/2-.17]}/>
  <HazardStrip position={[0,1.17,d/2+.01]} size={[w,.08,.03]}/>
  {[-.7,-.3].map(z=><mesh key={z} position={[0,1.63,z]}><cylinderGeometry args={[.12,.14,.4,10]}/><meshStandardMaterial color={C.burgundy} metalness={.5}/></mesh>)}
 </>;
 if(f.type==='cabinet')return <>
  <mesh position={[0,h/2,-.03]} castShadow><boxGeometry args={[w,h,d-.06]}/><meshStandardMaterial color={C.panel} roughness={.75} metalness={.4}/></mesh>
  <group position={[0,h*.48,d/2-.16]}><Reactor radius={Math.min(w*.42,.46)} depth={.19} active={online}/></group>
  <CRTMonitor title="AUX / CONTROL" status={status} lines={lines.slice(1,5)} width={w-.1} height={.43} position={[0,h-.3,d/2-.16]}/>
  <HazardStrip position={[0,.12,d/2+.005]} size={[w,.08,.025]}/>
 </>;
 return null;
}
