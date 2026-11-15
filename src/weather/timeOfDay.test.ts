import { afterEach,beforeEach,describe,it,expect } from 'vitest';
import { nextTimeOfDay,daylightProfile,migrateSurfaceTime } from './timeOfDay';
import { habitatClock } from '../characters/crewRoutine';
import { useCrewLife } from '../characters/crewStore';
import { useSurfaceWeather } from './store';
import { useGame,simulationSnapshot } from '../store/game';
import { createScenario } from '../simulation/scenario';
import { connectSurfaceIncidents } from './bridge';
import { activeSurfaceIncidents } from './incidents';
import { applyTraining } from '../training/engine';
import { attemptFor } from '../training/attempts';

const at=(hour:number)=>hour*30;
describe('forward-only hour skips',()=>{
 it.each([[20,8,22,20],[23,23,8,24],[20,23,22,21],[20,1,8,20],[20,22,8,21]])('advances sol %i at %i:00 to %i:00 on sol %i',(sol,hour,target,day)=>{
  expect(nextTimeOfDay(sol,at(hour),target)).toEqual({sol:day,seconds:at(target)});
 });
 it('does not skip an extra day at the exact target, wrap after sol 720, or accept invalid hours',()=>{
  expect(nextTimeOfDay(20,at(22),22)).toBeNull();expect(nextTimeOfDay(720,at(23),8)).toBeNull();
  expect(nextTimeOfDay(720,at(8),22)).toEqual({sol:720,seconds:at(22)});
  for(const h of [NaN,Infinity,-1,24])expect(nextTimeOfDay(20,at(8),h)).toBeNull();
 });
 it('provides matching sunlight and sky brightness for morning, night and the following morning',()=>{
  expect(daylightProfile(at(8)).daylight).toBe(1);expect(daylightProfile(at(22)).daylight).toBe(0);
  expect(daylightProfile(at(32)).daylight).toBe(daylightProfile(at(8)).daylight);
  expect(daylightProfile(at(8)).direction[1]).toBeGreaterThan(0);expect(daylightProfile(at(22)).direction[1]).toBeLessThan(0);
 });
});
describe('one surface and crew clock',()=>{
 const game=useGame.getState(),weather=useSurfaceWeather.getState(),crew=useCrewLife.getState();let disconnect:(()=>void)|undefined;
 beforeEach(()=>{useGame.setState({...createScenario(),prologueSeen:true});useSurfaceWeather.setState({sol:20,seconds:at(8),missionSol:1,missionSeed:null,previewSol:null,blocked:false});useCrewLife.setState({seconds:at(12)})});
 afterEach(()=>{disconnect?.();disconnect=undefined;useGame.setState(game,true);useSurfaceWeather.setState(weather,true);useCrewLife.setState(crew,true)});
 it('keeps lights-out on the current day, then advances morning to the next day without changing resource-campaign state',()=>{
  disconnect=connectSurfaceIncidents();const before=simulationSnapshot(useGame.getState());
  useSurfaceWeather.getState().skipToHour(22);
  expect(useSurfaceWeather.getState().sol).toBe(20);expect(habitatClock(useCrewLife.getState().seconds)).toBe('22:00');
  useSurfaceWeather.getState().skipToHour(8);
  expect(useSurfaceWeather.getState().sol).toBe(21);expect(habitatClock(useCrewLife.getState().seconds)).toBe('08:00');
  // Only the exterior chronology's through-sol changes; resources are settled by the campaign's Next sol action.
  expect(useGame.getState().resources).toEqual(before.resources);expect(useGame.getState().sol).toBe(before.sol);
 });
 it('advances natural midnight exactly once and keeps harmless archive previews separate from the real clock',()=>{
  useSurfaceWeather.setState({sol:23,seconds:719});disconnect=connectSurfaceIncidents();
  useSurfaceWeather.getState().tick(1.5);
  expect(useSurfaceWeather.getState().sol).toBe(24);expect(useCrewLife.getState().seconds).toBe(.5);
  const real=useCrewLife.getState().seconds;useSurfaceWeather.getState().preview(574);
  expect(useSurfaceWeather.getState().sol).toBe(24);expect(useCrewLife.getState().seconds).toBe(real);
  expect(activeSurfaceIncidents(useGame.getState())).toHaveLength(0);
 });
 it('interrupts an overnight skip at a new environmental incident instead of jumping past it',()=>{
  useSurfaceWeather.setState({sol:283,seconds:at(23)});disconnect=connectSurfaceIncidents();
  useSurfaceWeather.getState().skipToHour(8);
  expect(useSurfaceWeather.getState().sol).toBe(284);expect(useSurfaceWeather.getState().seconds).toBe(0);
  expect(activeSurfaceIncidents(useGame.getState()).map(e=>e.id)).toEqual(['ice-clouds']);expect(useSurfaceWeather.getState().blocked).toBe(true);
  useSurfaceWeather.getState().skipToHour(22);expect(useSurfaceWeather.getState().seconds).toBe(0);
 });
 it('does not convert skipped hours into active challenge time or bypass failed-system locks',()=>{
  useGame.setState(applyTraining(createScenario(),'dust',{type:'begin-attempt'}));disconnect=connectSurfaceIncidents();
  useSurfaceWeather.getState().skipToHour(22);expect(attemptFor(useGame.getState(),'dust')?.elapsed).toBe(0);
  for(let i=0;i<180;i++)useGame.getState().challengeTick(.5);
  const before=useSurfaceWeather.getState();expect(before.blocked).toBe(true);
  useSurfaceWeather.getState().skipToHour(8);
  expect(useSurfaceWeather.getState().sol).toBe(before.sol);expect(useSurfaceWeather.getState().seconds).toBe(before.seconds);
  expect(attemptFor(useGame.getState(),'dust')?.status).toBe('failed');
 });
 it('migrates an older save using the displayed habitat hour while preserving its surface day',()=>{
  useCrewLife.setState({seconds:at(23)});
  const saved={sol:23,seconds:10,missionSol:1,missionSeed:42};
  const migrated=migrateSurfaceTime(saved,1,useCrewLife.getState().seconds) as typeof saved;
  expect(migrated.sol).toBe(23);expect(migrated.seconds).toBe(at(23));
  expect(habitatClock(migrated.seconds)).toBe('23:00');
  expect(migrateSurfaceTime(saved,2,at(23))).toBe(saved);
 });
});
