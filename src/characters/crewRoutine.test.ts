import { describe,it,expect } from 'vitest';
import { initialBuildings } from '../simulation/engine';
import { createScenario } from '../simulation/scenario';
import { CELL, makeLayout } from '../explorer/layout';
import { makeFixtures } from '../explorer/fixtures';
import { clearFloor, clearSegment, crewBerths, findCrewPath, makeCrewNavigation, roomDestination } from './crewNavigation';
import { createCrewAgent, DEFAULT_HABITAT_SECONDS, doorOnStep, habitatClock, HABITAT_DAY_SECONDS, nightShift, stepCrew } from './crewRoutine';
const layout=makeLayout(initialBuildings),fixtures=makeFixtures(layout),nav=makeCrewNavigation(layout,fixtures),beds=crewBerths(nav),crew=createScenario().astronauts;
const at=(hour:number)=>hour/24*HABITAT_DAY_SECONDS;

describe('crew circulation and bunk access',()=>{
 it('provides separate reachable bunks for the entire crew, preferring lower mattresses',()=>{
  expect(beds.length).toBeGreaterThanOrEqual(crew.length);expect(new Set(beds.map(b=>b.id)).size).toBe(beds.length);
  expect(beds.slice(0,crew.length).every(b=>b.level===0)).toBe(true);
  for(const bed of beds){expect(clearFloor(layout,fixtures,bed.approach),bed.id).toBe(true);const path=findCrewPath(nav,roomDestination(nav,layout.habitat),bed.approach);expect(path.length,bed.id).toBeGreaterThan(0);}
 });
 it('routes every berth to all workrooms without cutting through furniture, walls or the airlock',()=>{
  for(const bed of beds.filter(b=>b.level===0))for(const room of layout.rooms){
   const path=findCrewPath(nav,bed.approach,roomDestination(nav,room));expect(path.length,`${bed.id} to ${room.id}`).toBeGreaterThan(0);
   for(let i=1;i<path.length;i++)expect(clearSegment(nav,path[i-1],path[i]),`${bed.id} / ${room.id}`).toBe(true);
  }
  expect(clearFloor(layout,fixtures,{x:layout.airlock.x,z:layout.airlock.centerZ})).toBe(false);
  expect(clearFloor(layout,fixtures,{x:fixtures[0].x,z:fixtures[0].z})).toBe(false);
 });
 it('supports new rooms and their corridor connections',()=>{
  const expanded=makeLayout([...initialBuildings,{id:'crew-test-lab',kind:'research',x:24,z:22,active:true}]),f=makeFixtures(expanded),n=makeCrewNavigation(expanded,f),target=expanded.rooms.find(r=>r.id==='crew-test-lab')!;
  const path=findCrewPath(n,roomDestination(n,expanded.habitat),roomDestination(n,target));expect(path.length).toBeGreaterThan(0);for(let i=1;i<path.length;i++)expect(clearSegment(n,path[i-1],path[i])).toBe(true);
 });
});
describe('autonomous daily routine',()=>{
 it('keeps an overnight rest window that crosses midnight',()=>{
  expect(habitatClock(DEFAULT_HABITAT_SECONDS)).toBe('08:00');expect(nightShift(at(21.99))).toBe(false);expect(nightShift(at(22))).toBe(true);expect(nightShift(at(1))).toBe(true);expect(nightShift(at(5.99))).toBe(true);expect(nightShift(at(6))).toBe(false);expect(habitatClock(at(24))).toBe('00:00');
 });
 it('walks to a real workplace and later returns to its own bunk before sleeping',()=>{
  const c=crew[1],bed=beds[1],a=createCrewAgent(c.id,bed.approach,bed);
  for(let i=0;i<2200;i++)stepCrew(a,c,nav,at(10),.1,0,[],{});
  expect(Math.hypot(a.position.x-bed.approach.x,a.position.z-bed.approach.z)).toBeGreaterThan(3);
  let movedWhileReturning=false;
  for(let i=0;i<4000&&a.activity!=='sleeping';i++){const before={...a.position};stepCrew(a,c,nav,at(22),.1,0,[],{});if(a.activity==='returning'&&Math.hypot(a.position.x-before.x,a.position.z-before.z)>0)movedWhileReturning=true;}
  expect(movedWhileReturning).toBe(true);expect(a.activity).toBe('sleeping');expect(a.blend).toBe(1);expect(a.position).toEqual(bed.approach);expect(a.berth?.id).toBe(bed.id);
  for(let i=0;i<50;i++)stepCrew(a,c,nav,at(8),.1,0,[],{});
  expect(a.blend).toBe(0);expect(a.activity).not.toBe('sleeping');expect(a.speed).toBeGreaterThan(0);
 });
 it('waits at the assigned bunk in the evening, then lies down only at lights out',()=>{
  const a=createCrewAgent(crew[2].id,beds[2].approach,beds[2]);for(let i=0;i<30;i++)stepCrew(a,crew[2],nav,at(21.5),.1,1,[],{});
  expect(a.blend).toBe(0);expect(a.activity).not.toBe('sleeping');
  for(let i=0;i<20;i++)stepCrew(a,crew[2],nav,at(22),.1,1,[],{});expect(a.activity).toBe('sleeping');
 });
 it('sends rest assignments and exhausted crew to sleep during the day, and keeps sheltering crew awake',()=>{
  for(const c of [{...crew[2],assignment:'rest' as const},{...crew[2],fatigue:85}]){const a=createCrewAgent(c.id,beds[2].approach,beds[2]);for(let i=0;i<20;i++)stepCrew(a,c,nav,at(12),.1,1,[],{});expect(a.activity).toBe('sleeping');}
  const a=createCrewAgent(crew[2].id,beds[2].approach,beds[2]);for(let i=0;i<30;i++)stepCrew(a,crew[2],nav,at(23),.1,1,[],{},true);expect(a.activity).toBe('sheltering');expect(a.blend).toBe(0);
 });
 it('yields to the player and replans around an occupied corridor',()=>{
  const bed=beds[1],a=createCrewAgent(crew[1].id,bed.approach,bed);stepCrew(a,crew[1],nav,at(10),.1,0,[],{});const next=a.path[0],direction={x:Math.sign(next.x-a.position.x),z:Math.sign(next.z-a.position.z)},obstacle={x:a.position.x+direction.x*.65,z:a.position.z+direction.z*.65},before={...a.position};
  stepCrew(a,crew[1],nav,at(10),.1,0,[obstacle],{});expect(a.activity).toBe('waiting');expect(a.position).toEqual(before);
 });
 it('detects closed corridor doors and never treats a closed airlock as traversable',()=>{
  const door=layout.doors.find(d=>!d.airlock)!;const a={x:door.x-(door.axis==='x'?.4:0),z:door.z-(door.axis==='z'?.4:0)},b={x:door.x+(door.axis==='x'?.4:0),z:door.z+(door.axis==='z'?.4:0)};
  expect(doorOnStep([door],a,b,{[door.id]:false})?.id).toBe(door.id);expect(doorOnStep([door],a,b,{[door.id]:true})).toBeUndefined();
  const outer=layout.doors.find(d=>d.airlock==='outer')!;expect(doorOnStep([outer],{x:outer.x,z:outer.z-.4},{x:outer.x,z:outer.z+.4},{})?.airlock).toBe('outer');
 });
 it('lets the whole NPC crew commute and reach separate beds without deadlocking',()=>{
  const people=crew.slice(1),agents=people.map((c,i)=>createCrewAgent(c.id,beds[i+1].approach,beds[i+1])),player={x:layout.spawn[0],z:layout.spawn[2]};
  const advance=(hour:number)=>agents.forEach((a,i)=>stepCrew(a,people[i],nav,at(hour),.1,i,[player,...agents.filter(other=>other!==a&&other.blend===0).map(other=>other.position)],{}));
  for(let i=0;i<2000;i++)advance(10);
  for(let i=0;i<5000&&!agents.every(a=>a.activity==='sleeping');i++)advance(22);
  for(const a of agents){expect(a.activity,a.id).toBe('sleeping');expect(a.position).toEqual(a.berth!.approach);}
  expect(new Set(agents.map(a=>a.berth!.id)).size).toBe(3);
 },10000);
 it('bounds movement after a frame stall and does not alter crew simulation assignments',()=>{
  const c=structuredClone(crew[1]),before=structuredClone(c),a=createCrewAgent(c.id,beds[1].approach,beds[1]),start={...a.position};stepCrew(a,c,nav,at(10),100,0,[],{});expect(Math.hypot(a.position.x-start.x,a.position.z-start.z)).toBeLessThanOrEqual(.12);expect(c).toEqual(before);
 });
});
