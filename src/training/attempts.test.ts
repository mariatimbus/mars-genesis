import { describe,it,expect } from 'vitest';
import { createScenario,nextSol } from '../simulation/survival';
import { migrateTraining,facilityUnlocked } from '../simulation/commissioning';
import { applyTraining,initialTask,reduceTask,restartTrainingTask,taskAvailable,lightRecipeValid,type TaskAction } from './engine';
import { solveTraining,solveTask } from './testHelpers';
import { tasks,type TaskId } from './catalog';
import { CHALLENGE_RULES,advanceChallengeClock,attemptFor,retryRemaining,deadlineFor,RETRY_ACTIVE_SECONDS,needsChallengeClock } from './attempts';
import { enterSurfaceSol,repairSurfaceIncident } from '../weather/incidentActions';
import { activeSurfaceIncidents,taskSuspended } from '../weather/incidents';
import type { SurvivalState } from '../simulation/types';
import { useCrewLife } from '../characters/crewStore';

function advance(s:SurvivalState,seconds:number){let n=s;for(let i=0;i<seconds*2;i++)n=advanceChallengeClock(n,.5);return n}
describe('operational failures and consequences',()=>{
 it('adds consequences to 13 tasks while leaving five explanatory lessons guided',()=>{
  expect(Object.keys(CHALLENGE_RULES)).toHaveLength(13);
  expect(tasks.filter(t=>!CHALLENGE_RULES[t.id]).map(t=>t.id)).toEqual(['split','kit','gravity','checkup','rock']);
  expect(RETRY_ACTIVE_SECONDS).toBe(30);expect(deadlineFor('battery','repair')).toBeLessThan(deadlineFor('battery','lesson')!);
  for(const id of Object.keys(CHALLENGE_RULES) as TaskId[])for(const mode of ['lesson','repair'] as const)expect([45,60]).toContain(deadlineFor(id,mode));
 });
 const badSubmissions:[TaskId,TaskAction][]=[['battery',{type:'connect'}],['scan',{type:'dig'}],['melt',{type:'heat',value:1}],['filter',{type:'run'}],['fill',{type:'connect'}],['lights',{type:'test'}],['plant',{type:'test'}],['irrigate',{type:'test'}],['antenna',{type:'send'}],['weather',{type:'match',index:0,value:1}]];
 for(const [id,action] of badSubmissions)it(`isolates ${id} after a wrong committed operation without erasing records or spending reserves`,()=>{
  let s=solveTraining(createScenario()),before=structuredClone(s);s=restartTrainingTask(s,id);s=applyTraining(s,id,{type:'begin-attempt'});s=applyTraining(s,id,action);
  expect(attemptFor(s,id)?.status).toBe('failed');expect(retryRemaining(s,id)).toBe(30);expect(taskSuspended(s,id)).toBe(true);
  expect(s.commissioning.training.records).toEqual(before.commissioning.training.records);
  expect(s.resources).toEqual(before.resources);expect(s.astronauts).toEqual(before.astronauts);expect(s.commissioning.training.credits).toBe(before.commissioning.training.credits);
  expect(nextSol(s)).toBe(s);expect(applyTraining(s,id,{type:'begin-attempt'})).toBe(s);expect(restartTrainingTask(s,id)).toBe(s);
 });
 it('keeps exploratory scans and draft adjustments safe, but stops an air regulator leaving its band',()=>{
  let s=solveTraining(createScenario());s=restartTrainingTask(s,'scan');s=applyTraining(s,'scan',{type:'scan'});
  expect(attemptFor(s,'scan')?.status).toBe('running');expect(s.commissioning.training.tasks.scan?.mistakes).toBe(1);
  s=restartTrainingTask(s,'fill');for(let i=0;i<7;i++)s=applyTraining(s,'fill',{type:'pour'});
  expect(attemptFor(s,'fill')?.status).toBe('running');s=applyTraining(s,'fill',{type:'drain'});s=applyTraining(s,'fill',{type:'connect'});expect(attemptFor(s,'fill')?.status).toBe('succeeded');
  s=restartTrainingTask(s,'air');s=applyTraining(s,'air',{type:'valve',value:100});
  for(let i=0;i<60;i++)s=applyTraining(s,'air',{type:'tick',value:.5});
  expect(attemptFor(s,'air')?.status).toBe('failed');
 });
 it('retains the deadline across reset, tab changes, saved-state reload and a second begin action',()=>{
  let s=applyTraining(createScenario(),'dust',{type:'begin-attempt'});s=advance(s,59);
  expect(attemptFor(s,'dust')?.elapsed).toBe(59);s=restartTrainingTask(s,'dust');
  expect(applyTraining(s,'dust',{type:'begin-attempt'})).toBe(s);
  s=migrateTraining(JSON.parse(JSON.stringify(s)));s=advance(s,.5);expect(attemptFor(s,'dust')?.status).toBe('running');
  s=advance(s,.5);expect(attemptFor(s,'dust')?.status).toBe('failed');expect(retryRemaining(s,'dust')).toBe(30);
  expect(advanceChallengeClock(s,Infinity)).toBe(s);expect(advanceChallengeClock(s,-1)).toBe(s);
 });
 it('waits exactly one game hour, allows only a new attempt afterwards and restores dependencies on success',()=>{
  let s=solveTraining(createScenario()),credits=s.commissioning.training.credits;
  s=restartTrainingTask(s,'lights');s=applyTraining(s,'lights',{type:'test'});
  expect(facilityUnlocked(s,'greenhouse')).toBe(false);expect(taskAvailable(s,'plant')).toBe(false);expect(taskAvailable(s,'scan')).toBe(true);
  s=advance(s,29.5);expect(retryRemaining(s,'lights')).toBe(.5);expect(taskAvailable(s,'lights')).toBe(false);
  s=advance(s,.5);expect(taskAvailable(s,'lights')).toBe(true);expect(taskSuspended(s,'lights')).toBe(true);
  expect(applyTraining(s,'lights',{type:'light',index:0,value:60})).toBe(s);
  s=solveTask(s,'lights');expect(attemptFor(s,'lights')?.status).toBe('succeeded');expect(taskAvailable(s,'plant')).toBe(true);expect(facilityUnlocked(s,'greenhouse')).toBe(true);
  expect(s.commissioning.training.credits).toBe(credits);
 });
 it('does not tie a persisted cooldown to the editable crew inspection clock',()=>{
  let s=solveTraining(createScenario());s=restartTrainingTask(s,'battery');s=applyTraining(s,'battery',{type:'connect'});s=advance(s,10);
  const before=useCrewLife.getState().seconds;useCrewLife.getState().setTime(22);expect(retryRemaining(s,'battery')).toBe(20);useCrewLife.setState({seconds:before});
  const restored=migrateTraining(JSON.parse(JSON.stringify(s)));expect(retryRemaining(restored,'battery')).toBe(20);
 });
 it('does not punish mistakes in guided medical and molecular interpretation lessons',()=>{
  let s=solveTraining(createScenario());s=restartTrainingTask(s,'checkup');s=applyTraining(s,'checkup',{type:'match',index:0,value:1});
  expect(s.commissioning.training.tasks.checkup?.mistakes).toBe(1);expect(attemptFor(s,'checkup')).toBeUndefined();expect(taskSuspended(s,'checkup')).toBe(false);
 });
});
describe('hard maintenance variants',()=>{
 it('requires more dust work, two gusts, two filtration samples and two weather-station rounds',()=>{
  let normal=initialTask('dust'),hard=initialTask('dust',true),normalWipes=0,hardWipes=0;
  while(!normal.done){const i=normal.values.findIndex(v=>v>0);normal=reduceTask('dust',normal,{type:'wipe',index:i});normalWipes++}
  while(!hard.done){const i=hard.values.findIndex(v=>v>0);hard=reduceTask('dust',hard,{type:'wipe',index:i});hardWipes++}
  expect(normalWipes).toBe(25);expect(hardWipes).toBe(44);expect(hard.phase).toBe(2);
  let filter=initialTask('filter',true);for(let pass=0;pass<2;pass++){for(let index=0;index<3;index++)filter=reduceTask('filter',filter,{type:'choose',index});filter=reduceTask('filter',filter,{type:'run'});filter=reduceTask('filter',filter,{type:'test'});expect(filter.done).toBe(pass===1)}
  let weather=initialTask('weather',true);for(let pass=0;pass<2;pass++){for(let index=0;index<4;index++)weather=reduceTask('weather',weather,{type:'match',index,value:index});expect(weather.done).toBe(pass===1)}
  expect(lightRecipeValid([50,50,0])).toBe(true);expect(lightRecipeValid([50,50,0],true)).toBe(false);expect(lightRecipeValid([60,40,10],true)).toBe(true);
 });
 it('keeps a failed maintenance incident active, disables restart during cooldown and recovers without repeat rewards',()=>{
  let s=enterSurfaceSol(solveTraining(createScenario()),284),credits=s.commissioning.training.credits;
  s=repairSurfaceIncident(s,'ice-clouds',{type:'begin-attempt'});expect(s.commissioning.training.incidents?.repairs.lights?.hard).toBe(true);
  s=repairSurfaceIncident(s,'ice-clouds',{type:'test'});expect(attemptFor(s,'lights','repair')?.status).toBe('failed');expect(activeSurfaceIncidents(s)).toHaveLength(1);
  expect(repairSurfaceIncident(s,'ice-clouds',{type:'restart'})).toBe(s);s=advance(s,30);
  expect(repairSurfaceIncident(s,'ice-clouds',{type:'light',index:0,value:60})).toBe(s);
  s=repairSurfaceIncident(s,'ice-clouds',{type:'begin-attempt'});
  for(const [index,value] of [60,40,10].entries())s=repairSurfaceIncident(s,'ice-clouds',{type:'light',index,value});
  s=repairSurfaceIncident(s,'ice-clouds',{type:'test'});expect(activeSurfaceIncidents(s)).toHaveLength(0);expect(s.commissioning.training.credits).toBe(credits);
 });
 it('retains repair time when the board resets and enforces its deadline without stage ticks',()=>{
  let s=enterSurfaceSol(createScenario(),284);s=repairSurfaceIncident(s,'ice-clouds',{type:'begin-attempt'});s=advance(s,44);
  s=repairSurfaceIncident(s,'ice-clouds',{type:'restart'});expect(attemptFor(s,'lights','repair')?.elapsed).toBe(44);
  s=advance(s,1);expect(attemptFor(s,'lights','repair')?.status).toBe('failed');expect(needsChallengeClock(s)).toBe(true);
  s=advance(s,30);expect(needsChallengeClock(s)).toBe(false);expect(activeSurfaceIncidents(s)).toHaveLength(1);
 });
});
