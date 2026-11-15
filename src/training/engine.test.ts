import { describe,it,expect } from 'vitest';
import { createScenario } from '../simulation/scenario';
import { commissioningComplete, facilityUnlocked, migrateTraining } from '../simulation/commissioning';
import { tasks, roomTasks, TRAINING_ROOMS, references } from './catalog';
import { applyTraining, reduceTask, initialTask, restartTrainingTask, taskAvailable } from './engine';
import { advanceChallengeClock,attemptFor } from './attempts';
import { solveTask, solveTraining } from './testHelpers';

describe('hands-on junior astronaut training',()=>{
 it('solves all 18 tasks through player controls, unlocks six rooms and leaves mission supplies and time paused',()=>{
  let s=createScenario();const before=structuredClone(s);
  for(const task of tasks){
   expect(taskAvailable(s,task.id),task.id).toBe(true);s=solveTask(s,task.id);
   expect(s.commissioning.training.tasks[task.id]?.done,task.id).toBe(true);
   expect(s.commissioning.training.records[task.id]?.stars,task.id).toBe(3);
  }
  expect(commissioningComplete(s)).toBe(true);expect(s.commissioning.completed).toEqual([...TRAINING_ROOMS]);
  expect(s.commissioning.training.credits).toBe(270);expect(s.commissioning.training.weatherUnlocked).toBe(true);
  expect(s.resources).toEqual(before.resources);expect(s.systems).toEqual(before.systems);expect(s.astronauts).toEqual(before.astronauts);expect(s.sol).toBe(1);
  expect(s.buildings.every(b=>b.active)).toBe(true);
 });
 it('requires the full preceding lesson and rejects an arbitrary completion action',()=>{
  const s=createScenario();expect(applyTraining(s,'dust',{type:'complete'})).toBe(s);
  for(const task of tasks.slice(1))expect(applyTraining(s,task.id,{type:'test'})).toBe(s);
  const partial=solveTask(s,'dust');expect(taskAvailable(partial,'sun')).toBe(true);expect(taskAvailable(partial,'battery')).toBe(false);expect(facilityUnlocked(partial,'solar')).toBe(false);
 });
 it('activates habitats with oxygen and depots with the water room',()=>{
  let s=createScenario();for(const room of TRAINING_ROOMS.slice(0,3))for(const task of roomTasks(room))s=solveTask(s,task.id);
  expect(s.buildings.filter(b=>b.kind==='habitat'||b.kind==='storage').every(b=>b.active)).toBe(true);
  expect(s.buildings.filter(b=>b.kind==='research'||b.kind==='medical').every(b=>!b.active)).toBe(true);
 });
 it('models a closed, pressurized melting plateau and an energy-wasting overheat',()=>{
  let t=initialTask('melt');const act=(type:string,value?:number)=>{t=reduceTask('melt',t,{type,value})};
  act('load');act('heat',1);expect(t.values[0]).toBe(0);expect(t.mistakes).toBe(1);expect(t.done).toBe(false);
  act('load');act('lid');act('pump');act('pump');act('pump');act('heat',1);
  for(let i=0;i<16;i++)act('tick',.5);
  expect(t.values[3]).toBe(0);expect(t.values[4]).toBeGreaterThan(0);expect(t.values[4]).toBeLessThan(100);
  for(let i=0;i<12;i++)act('tick',.5);
  expect(t.values[4]).toBe(100);expect(t.values[3]).toBeGreaterThan(0);expect(t.done).toBe(false);expect(t.mistakes).toBe(2);
  act('heat',0);expect(t.done).toBe(true);
 });
 it('does not drill unscanned ground or award the wrong radar material',()=>{
  let t=reduceTask('scan',initialTask('scan'),{type:'dig'});expect(t.done).toBe(false);
  t=reduceTask('scan',t,{type:'scan'});t=reduceTask('scan',t,{type:'dig'});expect(t.done).toBe(false);expect(t.mistakes).toBeGreaterThanOrEqual(2);
  t=reduceTask('scan',t,{type:'move',value:3});t=reduceTask('scan',t,{type:'scan'});t=reduceTask('scan',t,{type:'dig'});expect(t.done).toBe(true);
 });
 it('requires filtration flow before the conductivity check, and coarse-to-fine ordering',()=>{
  let t=initialTask('filter');for(const index of [2,0,1])t=reduceTask('filter',t,{type:'choose',index});
  t=reduceTask('filter',t,{type:'run'});t=reduceTask('filter',t,{type:'test'});expect(t.done).toBe(false);expect(t.mistakes).toBe(2);
  t=reduceTask('filter',t,{type:'clear'});for(const index of [0,1,2])t=reduceTask('filter',t,{type:'choose',index});
  t=reduceTask('filter',t,{type:'run'});t=reduceTask('filter',t,{type:'test'});expect(t.done).toBe(true);
 });
 it('conserves the two-to-one H:O atom count and rejects wrong tanks or duplicate atoms',()=>{
  let t=initialTask('split');for(const type of ['load','current'])t=reduceTask('split',t,{type});
  t=reduceTask('split',t,{type:'sort',index:0,value:0});expect(t.marks).toEqual([]);expect(t.mistakes).toBe(1);
  for(let index=0;index<6;index++)t=reduceTask('split',t,{type:'sort',index,value:index%3===0?1:0});
  expect(t.done).toBe(true);expect(t.values.slice(0,2)).toEqual([4,2]);
  expect(reduceTask('split',t,{type:'sort',index:0,value:1})).toBe(t);
 });
 it('only accumulates stable air time inside the green band and clamps large timer jumps',()=>{
  let t=initialTask('air');t=reduceTask('air',t,{type:'tick',value:60});expect(t.values[2]).toBe(.5);
  t=reduceTask('air',t,{type:'valve',value:100});for(let i=0;i<20;i++)t=reduceTask('air',t,{type:'tick',value:.5});
  const stable=t.values[2];expect(t.values[0]).toBeGreaterThan(80);t=reduceTask('air',t,{type:'tick',value:.5});expect(t.values[2]).toBe(stable);expect(t.done).toBe(false);
 });
 it('requires scanning before crew support and records mistakes without spending resources',()=>{
  const t=reduceTask('checkup',initialTask('checkup'),{type:'match',index:0,value:0});expect(t.done).toBe(false);expect(t.marks).toEqual([]);expect(t.mistakes).toBe(1);
 });
 it('has no duplicate reward, preserves best stars on practice, and persists a real communication delay',()=>{
  let s=solveTraining(createScenario()),training=s.commissioning.training;
  expect(training.messageSentAt).toBe(1000);expect(training.messageDueAt).toBe(1000+s.environment.commDelayMinutes*60000);expect(training.replyDueAt).toBe(1000+s.environment.commDelayMinutes*120000);
  const credits=training.credits,oldDue=training.replyDueAt;s=restartTrainingTask(s,'antenna');s=applyTraining(s,'antenna',{type:'send'},50000);expect(s.commissioning.training.tasks.antenna?.mistakes).toBe(1);
  expect(attemptFor(s,'antenna')?.status).toBe('failed');for(let i=0;i<60;i++)s=advanceChallengeClock(s,.5);
  s=solveTask(s,'antenna');expect(attemptFor(s,'antenna')?.status).toBe('succeeded');expect(s.commissioning.training.credits).toBe(credits);expect(s.commissioning.training.records.antenna?.stars).toBe(3);expect(s.commissioning.training.replyDueAt).toBe(oldDue);
 });
 it('migrates a version 5 course without losing running systems, damage, reserves or crew',()=>{
  const s=createScenario();s.sol=8;s.buildings[0].active=true;s.buildings[0].damage=40;
  const legacy=structuredClone(s) as unknown as {commissioning:{completed:string[];training?:unknown}};
  legacy.commissioning.completed=['solar','habitat','medical','water','research','greenhouse','oxygen'];delete legacy.commissioning.training;
  const n=migrateTraining(legacy as unknown as typeof s);
  expect(commissioningComplete(n)).toBe(true);expect(n.commissioning.completed).toHaveLength(6);expect(n.commissioning.training.records).toEqual({});expect(taskAvailable(n,'dust')).toBe(true);
  expect(n.buildings).toEqual(s.buildings);expect(n.resources).toEqual(s.resources);expect(n.astronauts).toEqual(s.astronauts);expect(n.sol).toBe(8);
 });
 it('rejects nonfinite input and keeps training data serializable',()=>{
  const s=createScenario();expect(applyTraining(s,'dust',{type:'wipe',index:NaN})).toBe(s);expect(applyTraining(s,'dust',{type:'tick',value:Infinity})).toBe(s);
  expect(JSON.parse(JSON.stringify(solveTraining(s))).commissioning.training.records).toHaveProperty('weather');
 });
 it('attaches primary source links and short three-bubble guides to every discovery',()=>{
  expect(tasks).toHaveLength(18);expect(new Set(tasks.map(t=>t.id)).size).toBe(18);
  for(const task of tasks){expect(task.intro).toHaveLength(3);for(const bubble of task.intro)expect(bubble.split(/\s+/).length).toBeLessThan(15);expect(task.sources.length).toBeGreaterThan(0);for(const source of task.sources)expect(references[source].url).toMatch(/^https:\/\/([^/]+\.)?nasa\.gov\//);}
 });
});
