import { describe,it,expect } from 'vitest';
import { createScenario } from '../simulation/survival';
import { solveTraining } from '../training/testHelpers';
import { applyTraining,restartTrainingTask } from '../training/engine';
import { advanceChallengeClock,attemptFor } from '../training/attempts';
import { roomSuspended,SURFACE_INCIDENTS } from './incidents';
import { enterSurfaceSol,repairSurfaceIncident } from './incidentActions';
import { baseAlertState,roomMaintenance,alertPulse } from './alertState';

describe('base alert and map maintenance',()=>{
 it('stays quiet during ordinary startup and guided practice',()=>{
  const s=createScenario();expect(baseAlertState(s).active).toBe(false);
  for(const kind of ['habitat','solar','water','oxygen','greenhouse','medical','research','storage'] as const)expect(roomMaintenance(s,kind).blocked).toBe(false);
 });
 it('activates for every environmental incident and marks the same rooms as actual dependency locks',()=>{
  for(const event of SURFACE_INCIDENTS){
   const before=solveTraining(createScenario());before.commissioning.training.incidents!.throughSol=event.sol-1;
   const s=enterSurfaceSol(before,event.sol),alert=baseAlertState(s);
   expect(alert.active).toBe(true);expect(alert.roots).toEqual([event.task]);
   for(const kind of ['solar','water','oxygen','greenhouse','medical','research','storage'] as const){
    const lock=roomMaintenance(s,kind);
    expect(lock.blocked).toBe(roomSuspended(s,kind==='storage'?'water':kind));
    if(lock.blocked)expect(lock.repairTask).toBe(event.task);
   }
   expect(roomMaintenance(s,'habitat')).toEqual({blocked:false,direct:false});
  }
 });
 it('distinguishes the failed room from dependent rooms and ordinary mistakes from a base alarm',()=>{
  let s=restartTrainingTask(solveTraining(createScenario()),'lights');s=applyTraining(s,'lights',{type:'test'});
  expect(baseAlertState(s).active).toBe(false);
  expect(roomMaintenance(s,'greenhouse')).toEqual({blocked:true,direct:true,repairTask:'lights'});
  expect(roomMaintenance(s,'medical')).toEqual({blocked:true,direct:false,repairTask:'lights'});
  expect(roomMaintenance(s,'solar').blocked).toBe(false);expect(roomMaintenance(s,'storage').blocked).toBe(false);
 });
 it('retains a real environmental alarm through timeout, cooldown and save/reload',()=>{
  let s=enterSurfaceSol(solveTraining(createScenario()),284);
  s=repairSurfaceIncident(s,'ice-clouds',{type:'begin-attempt'});
  for(let i=0;i<180;i++)s=advanceChallengeClock(s,.5);
  expect(attemptFor(s,'lights','repair')?.status).toBe('failed');
  s=JSON.parse(JSON.stringify(s));
  expect(baseAlertState(s).active).toBe(true);expect(roomMaintenance(s,'greenhouse').direct).toBe(true);
 });
 it('keeps remaining alarms after one repair and clears lights/markers only after the last repair',()=>{
  let s=enterSurfaceSol(solveTraining(createScenario()),313);
  expect(baseAlertState(s).roots).toEqual(['dust','lights']);
  expect(roomMaintenance(s,'solar').direct).toBe(true);expect(roomMaintenance(s,'storage').direct).toBe(false);
  for(let pass=0;pass<8;pass++)for(let index=0;index<12;index++)s=repairSurfaceIncident(s,'regional-dust',{type:'wipe',index});
  expect(baseAlertState(s).active).toBe(true);expect(baseAlertState(s).roots).toEqual(['lights']);
  expect(roomMaintenance(s,'solar').blocked).toBe(false);expect(roomMaintenance(s,'greenhouse').blocked).toBe(true);
  for(const [index,value] of [60,40,10].entries())s=repairSurfaceIncident(s,'ice-clouds',{type:'light',index,value});
  s=repairSurfaceIncident(s,'ice-clouds',{type:'test'});
  expect(baseAlertState(s).active).toBe(false);
  for(const kind of ['solar','water','oxygen','greenhouse','medical','research','storage'] as const)expect(roomMaintenance(s,kind).blocked).toBe(false);
 });
 it('uses a slow two-second light cycle and steady red when reduced motion is requested',()=>{
  expect(alertPulse(0)).toBe(.25);expect(alertPulse(1)).toBe(1);expect(alertPulse(2)).toBe(.25);
  for(const t of [0,.5,1,1.5,2])expect(alertPulse(t,true)).toBe(1);
 });
});
