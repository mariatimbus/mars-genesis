import { describe,it,expect } from 'vitest';
import { createScenario } from './scenario';
import { nextSol } from './survival';
import { calculateOperations } from './lifeSupport';
import { updateCrew } from './crewHealth';
import { validPlacement } from './engine';
import { answerStartup, STARTUP_CHALLENGES, STARTUP_KINDS, commissioningComplete, facilityUnlocked, migrateStartup } from './commissioning';
import { commissionAll, readyScenario } from './testHelpers';

describe('seven facility startup challenges',()=>{
 it('prebuilds every requested facility offline with room for the two new buildings',()=>{
  const s=createScenario();
  for(const kind of STARTUP_KINDS){expect(s.buildings.some(b=>b.kind===kind)).toBe(true);expect(facilityUnlocked(s,kind)).toBe(false);}
  expect(s.buildings.every(b=>!b.active)).toBe(true);
  for(const b of s.buildings.filter(b=>b.kind==='medical'||b.kind==='water'))expect(validPlacement(b.kind,b.x,b.z,s.buildings.filter(other=>other.id!==b.id))).toBe(true);
 });
 it('keeps time, reserves and crew unchanged until all challenges are complete',()=>{
  const s=createScenario(2026,'expert'),before=structuredClone(s);
  for(let i=0;i<40;i++)expect(nextSol(s)).toEqual(before);
  let n=answerStartup(s,'solar','align');
  expect(nextSol(n)).toEqual(n);expect(n.resources).toEqual(s.resources);expect(n.astronauts).toEqual(s.astronauts);
  n=commissionAll(n);expect(commissioningComplete(n)).toBe(true);expect(nextSol(n).sol).toBe(2);
 });
 it('a wrong answer explains the problem and never activates a building or spends supplies',()=>{
  const s=createScenario(),n=answerStartup(s,'water','unlimited');
  expect(n.commissioning.feedback?.correct).toBe(false);expect(n.commissioning.feedback?.text).toContain('does not create');
  expect(n.commissioning.attempts.water).toBe(1);expect(n.commissioning.completed).toEqual([]);
  expect(n.buildings).toEqual(s.buildings);expect(n.resources).toEqual(s.resources);
 });
 it('each correct solution activates only its facility group and cannot be rewarded twice',()=>{
  for(const challenge of STARTUP_CHALLENGES){
   const s=createScenario(),n=answerStartup(s,challenge.kind,challenge.options.find(o=>o.correct)!.id);
   expect(n.commissioning.completed).toEqual([challenge.kind]);
   for(const b of n.buildings)expect(b.active).toBe(b.kind===challenge.kind||(b.kind==='storage'&&challenge.kind==='water'));
   expect(n.resources).toEqual(s.resources);expect(n.sol).toBe(1);
   expect(answerStartup(n,challenge.kind,challenge.options.find(o=>o.correct)!.id)).toEqual(n);
  }
 });
 it('rejects unknown answers, finished missions and missing facilities',()=>{
  const s=createScenario();expect(answerStartup(s,'solar','unknown')).toEqual(s);
  s.status='lost';expect(answerStartup(s,'solar','align')).toEqual(s);
  s.status='playing';s.buildings=s.buildings.filter(b=>b.kind!=='solar');expect(answerStartup(s,'solar','align')).toEqual(s);
 });
 it('locked facilities cannot produce even if a stale save marks them active',()=>{
  const s=createScenario();s.buildings=s.buildings.map(b=>({...b,active:true}));
  const n=calculateOperations(s);
  expect(n.report.generatedKwh).toBe(0);expect(n.state.stats.produced.oxygen).toBe(0);expect(n.state.stats.produced.food).toBe(0);expect(n.state.systems.research).toBe(0);expect(n.report.safeHabitat).toBe(false);
 });
 it('water recycling and ice extraction stop when the water facility is powered down',()=>{
  const s=readyScenario(),working=calculateOperations(s);s.buildings=s.buildings.map(b=>b.kind==='water'?{...b,active:false}:b);
  const offline=calculateOperations(s);expect(working.state.systems.recycling).toBe(.9);expect(offline.state.systems.recycling).toBe(0);expect(offline.state.systems.waterKg).toBeLessThan(working.state.systems.waterKg);
  for(const b of s.buildings.filter(b=>b.kind==='storage'))expect(offline.report.powered[b.id]).toBe(0);
 });
 it('keeps oxygen ahead of medical equipment when battery energy is scarce',()=>{
  const s=readyScenario();s.resources.power=39;s.buildings=s.buildings.map(b=>b.kind==='solar'?{...b,active:false}:b);
  const r=calculateOperations(s).report;for(const b of s.buildings.filter(b=>b.kind==='oxygen'))expect(r.powered[b.id]).toBe(1);expect(r.powered[s.buildings.find(b=>b.kind==='medical')!.id]).toBe(0);
 });
 it('a medical bay needs power and an assigned working medic to improve recovery',()=>{
  const s=readyScenario();s.astronauts[0].health=70;
  const active=calculateOperations(s),healthy=updateCrew(active.state,active.report);
  const bay=s.buildings.find(b=>b.kind==='medical')!;bay.active=false;
  const offline=calculateOperations(s),unsupported=updateCrew(offline.state,offline.report);
  expect(active.report.powered[bay.id]).toBe(1);expect(offline.report.powered[bay.id]).toBe(0);expect(healthy.astronauts[0].health).toBeGreaterThan(unsupported.astronauts[0].health);
 });
 it('upgrades an ongoing legacy colony without relocking systems or changing its reserves',()=>{
  const s=readyScenario();s.sol=12;s.buildings=s.buildings.filter(b=>b.kind!=='medical'&&b.kind!=='water');s.buildings[0].active=false;s.buildings[1].damage=55;
  const before=structuredClone(s),n=migrateStartup(s);
  expect(commissioningComplete(n)).toBe(true);expect(n.resources).toEqual(before.resources);expect(n.astronauts).toEqual(before.astronauts);expect(n.sol).toBe(12);expect(n.buildings[0].active).toBe(false);expect(n.buildings[1].damage).toBe(55);
  expect(n.buildings.filter(b=>b.kind==='medical'||b.kind==='water').every(b=>b.active)).toBe(true);
  expect(s).toEqual(before);
 });
 it('moves a legacy Sol 1 colony into startup while preserving its reserve and layout',()=>{
  const s=readyScenario(),n=migrateStartup(s);expect(n.commissioning.completed).toEqual([]);expect(n.resources).toEqual(s.resources);expect(n.buildings.map(b=>[b.id,b.x,b.z])).toEqual(s.buildings.map(b=>[b.id,b.x,b.z]));expect(n.buildings.every(b=>!b.active)).toBe(true);
 });
});
