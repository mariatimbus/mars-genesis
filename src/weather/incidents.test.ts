import { beforeEach,afterEach,describe,it,expect } from 'vitest';
import { createScenario,nextSol } from '../simulation/survival';
import { facilityUnlocked,migrateTraining } from '../simulation/commissioning';
import { calculateOperations } from '../simulation/lifeSupport';
import { solveTraining,circuitSolution } from '../training/testHelpers';
import { applyTraining,restartTrainingTask,taskAvailable,type TaskAction } from '../training/engine';
import { tasks,type TaskId } from '../training/catalog';
import type { SurvivalState } from '../simulation/types';
import { enterSurfaceSol,repairSurfaceIncident } from './incidentActions';
import { activeSurfaceIncidents,SURFACE_INCIDENTS,taskSuspended,roomSuspended,type SurfaceIncidentId } from './incidents';
import { connectSurfaceIncidents } from './bridge';
import { useGame,simulationSnapshot } from '../store/game';
import { useSurfaceWeather } from './store';

function repair(s:SurvivalState,id:SurfaceIncidentId){
 let state=s;const event=SURFACE_INCIDENTS.find(e=>e.id===id)!;
 const act=(type:string,index?:number,value?:number)=>{state=repairSurfaceIncident(state,id,{type,index,value})};
 switch(event.task){
  case 'lights':act('light',0,60);act('light',1,40);act('light',2,10);act('test');break;
  case 'dust':for(let pass=0;pass<8;pass++)for(let i=0;i<12;i++)act('wipe',i);break;
  case 'battery':for(const [color,cells] of circuitSolution)for(const cell of cells)act('draw',cell,color);act('connect');break;
  case 'filter':for(let pass=0;pass<2;pass++){for(let i=0;i<3;i++)act('choose',i);act('run');act('test')}break;
  case 'weather':for(let pass=0;pass<2;pass++)for(let i=0;i<4;i++)act('match',i,i);break;
 }
 return state;
}
const locked=(s:SurvivalState)=>tasks.filter(t=>taskSuspended(s,t.id)).map(t=>t.id);
describe('surface event maintenance and dependency locks',()=>{
 it('maps every skip milestone to a distinct incident and preserves all original achievements',()=>{
  let s=solveTraining(createScenario()),before=structuredClone(s.commissioning.training),buildings=structuredClone(s.buildings);
  for(const event of SURFACE_INCIDENTS){
   s=enterSurfaceSol(s,event.sol);expect(activeSurfaceIncidents(s).map(e=>e.id)).toContain(event.id);
   expect(taskSuspended(s,event.task)).toBe(true);expect(taskAvailable(s,event.task)).toBe(false);
   expect(s.commissioning.training.records).toEqual(before.records);expect(s.commissioning.training.tasks).toEqual(before.tasks);
   expect(applyTraining(s,event.task,{type:'test'})).toBe(s);expect(restartTrainingTask(s,event.task)).toBe(s);
   expect(nextSol(s)).toBe(s);
   const resources=structuredClone(s.resources),crew=structuredClone(s.astronauts);
   s=repair(s,event.id);
   expect(activeSurfaceIncidents(s)).toHaveLength(0);expect(locked(s)).toEqual([]);
   expect(s.commissioning.training.records).toEqual(before.records);expect(s.commissioning.training.credits).toBe(before.credits);
   expect(s.commissioning.training.tasks).toEqual(before.tasks);expect(s.buildings).toEqual(buildings);
   expect(s.resources).toEqual(resources);expect(s.astronauts).toEqual(crew);
  }
  expect(s.commissioning.training.incidents?.triggered).toHaveLength(6);
 });
 it('suspends exactly the dependent branches for each repaired event',()=>{
  let s=solveTraining(createScenario());
  const expected:Partial<Record<SurfaceIncidentId,TaskId[]>>={
   'ice-clouds':['lights','plant','irrigate','kit','gravity','checkup','antenna','rock','weather'],
   'regional-dust':tasks.map(t=>t.id),'dust-c-arrival':tasks.map(t=>t.id),
   'dust-c-peak':tasks.filter(t=>!['dust','sun'].includes(t.id)).map(t=>t.id),
   'persistent-dust':['filter','fill','split','air','lights','plant','irrigate','kit','gravity','checkup','antenna','rock','weather'],
   'pressure-tides':['weather'],
  };
  for(const event of SURFACE_INCIDENTS){s=enterSurfaceSol(s,event.sol);expect(locked(s)).toEqual(expected[event.id]);s=repair(s,event.id)}
 });
 it('stops actual module output and field availability while retaining emergency habitat support',()=>{
  let s=solveTraining(createScenario());s=repair(enterSurfaceSol(s,284),'ice-clouds');s=enterSurfaceSol(s,313);
  const report=calculateOperations(s).report;
  expect(report.generatedKwh).toBe(0);
  for(const kind of ['solar','water','oxygen','greenhouse','medical','research','storage'] as const)expect(facilityUnlocked(s,kind)).toBe(false);
  expect(facilityUnlocked(s,'habitat')).toBe(true);expect(s.buildings.every(b=>b.active)).toBe(true);
  s=repair(s,'regional-dust');expect(calculateOperations(s).report.generatedKwh).toBeGreaterThan(0);
  expect(s.commissioning.completed).toHaveLength(6);
 });
 it('allows an emergency repair before the player has completed the course, without granting that lesson for free',()=>{
  let s=enterSurfaceSol(createScenario(),313);expect(taskAvailable(s,'dust')).toBe(false);
  s=repair(s,'regional-dust'); // Clears both dust incidents only if their tasks match; clouds remain independent.
  expect(taskSuspended(s,'dust')).toBe(false);expect(taskAvailable(s,'dust')).toBe(true);
  expect(s.commissioning.training.records.dust).toBeUndefined();expect(s.commissioning.training.credits).toBe(0);
  expect(roomSuspended(s,'greenhouse')).toBe(true);expect(s.commissioning.completed).toEqual([]);
 });
 it('keeps cumulative locks on long jumps and clears shared dust faults together without clearing unrelated work',()=>{
  let s=enterSurfaceSol(solveTraining(createScenario()),574);
  expect(activeSurfaceIncidents(s)).toHaveLength(4);
  s=repair(s,'regional-dust');expect(activeSurfaceIncidents(s).map(e=>e.id)).toEqual(['ice-clouds','dust-c-peak']);
  expect(taskAvailable(s,'dust')).toBe(true);expect(taskSuspended(s,'battery')).toBe(true);
  s=repair(s,'dust-c-peak');expect(facilityUnlocked(s,'solar')).toBe(true);expect(roomSuspended(s,'greenhouse')).toBe(true);
  s=repair(s,'ice-clouds');expect(activeSurfaceIncidents(s)).toHaveLength(0);
 });
 it('persists partially completed repairs, refuses fake completion and never repeats a resolved event',()=>{
  let s=enterSurfaceSol(createScenario(),313);
  s=repairSurfaceIncident(s,'regional-dust',{type:'wipe',index:2});
  const saved=migrateTraining(JSON.parse(JSON.stringify(s)));
  expect(saved.commissioning.training.incidents?.repairs.dust?.values[2]).toBe(2);
  expect(repairSurfaceIncident(saved,'regional-dust',{type:'complete'})).toBe(saved);
  expect(repairSurfaceIncident(saved,'regional-dust',{type:'wipe',index:NaN})).toBe(saved);
  s=repair(saved,'regional-dust');s=repair(s,'ice-clouds');
  expect(enterSurfaceSol(s,313)).toBe(s);expect(enterSurfaceSol(s,1)).toBe(s);
  s=enterSurfaceSol(s,571);expect(activeSurfaceIncidents(s).map(e=>e.id)).toEqual(['dust-c-arrival']);
  expect(s.commissioning.training.incidents?.repairs.dust?.done).toBe(false);
 });
});

describe('surface day / mission bridge',()=>{
 let disconnect:(()=>void)|undefined;
 const game=useGame.getState(),weather=useSurfaceWeather.getState();
 beforeEach(()=>{useGame.setState({...createScenario(),prologueSeen:true});useSurfaceWeather.setState({sol:1,seconds:0,missionSol:1,missionSeed:null,previewSol:null,blocked:false})});
 afterEach(()=>{disconnect?.();disconnect=undefined;useGame.setState(game,true);useSurfaceWeather.setState(weather,true)});
 it('keeps inspection harmless, blocks time jumps until repaired, and resumes the same calendar afterwards',()=>{
  disconnect=connectSurfaceIncidents();const g=()=>useGame.getState(),w=()=>useSurfaceWeather.getState();
  const resources=structuredClone(g().resources);
  w().preview(574);expect(activeSurfaceIncidents(g())).toHaveLength(0);w().preview(null);
  w().skipToNextEvent();expect(w().sol).toBe(284);expect(w().blocked).toBe(true);
  w().skipToNextEvent();w().continueFrom(720);w().tick(720*3);expect(w().sol).toBe(284);
  useGame.setState(repair(simulationSnapshot(g()),'ice-clouds'));
  expect(w().blocked).toBe(false);w().skipToNextEvent();expect(w().sol).toBe(313);expect(w().blocked).toBe(true);
  expect(g().resources).toEqual(resources);
 });
 it('restores a persisted lock on connection and resets it with the mission, including a same-seed reset',()=>{
  useGame.setState(enterSurfaceSol(createScenario(),313));useSurfaceWeather.setState({sol:313});
  disconnect=connectSurfaceIncidents();expect(useSurfaceWeather.getState().blocked).toBe(true);
  useGame.getState().reset(useGame.getState().seed);
  expect(useSurfaceWeather.getState().sol).toBe(1);expect(useSurfaceWeather.getState().blocked).toBe(false);
  expect(activeSurfaceIncidents(useGame.getState())).toHaveLength(0);
 });
 it('triggers daily progression once and cannot create repeat locks by reconnecting',()=>{
  useSurfaceWeather.setState({sol:283,seconds:719});disconnect=connectSurfaceIncidents();
  useSurfaceWeather.getState().tick(1);expect(activeSurfaceIncidents(useGame.getState())).toHaveLength(1);
  disconnect();disconnect=connectSurfaceIncidents();expect(activeSurfaceIncidents(useGame.getState())).toHaveLength(1);
 });
 it('keeps failed ordinary lessons locked across day skips and releases the bridge only after a successful retry',()=>{
  useGame.setState(solveTraining(createScenario()));disconnect=connectSurfaceIncidents();
  const g=()=>useGame.getState(),w=()=>useSurfaceWeather.getState();
  g().restartTraining('lights');g().trainingAction('lights',{type:'test'});expect(w().blocked).toBe(true);
  w().skipToNextEvent();w().continueFrom(720);expect(w().sol).toBe(1);
  for(let i=0;i<60;i++)g().challengeTick(.5);expect(w().blocked).toBe(true);
  g().trainingAction('lights',{type:'begin-attempt'});for(const [index,value] of [60,40,10].entries())g().trainingAction('lights',{type:'light',index,value});
  g().trainingAction('lights',{type:'test'});expect(w().blocked).toBe(false);
 });
});
