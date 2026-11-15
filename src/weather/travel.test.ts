import { beforeEach,afterEach,describe,it,expect } from 'vitest';
import { useGame,simulationSnapshot } from '../store/game';
import { useSurfaceWeather } from './store';
import { useCrewLife } from '../characters/crewStore';
import { createScenario } from '../simulation/scenario';
import { solveTraining } from '../training/testHelpers';
import { activeSurfaceIncidents,roomSuspended } from './incidents';
import { baseAlertState } from './alertState';
import { connectSurfaceIncidents } from './bridge';
import { travelToSurfaceSol } from './travel';

describe('committed weather travel',()=>{
 const game=useGame.getState(),weather=useSurfaceWeather.getState(),crew=useCrewLife.getState();let disconnect:(()=>void)|undefined;
 beforeEach(()=>{useGame.setState({...solveTraining(createScenario()),prologueSeen:true});useSurfaceWeather.setState({sol:20,seconds:240,missionSol:1,missionSeed:null,previewSol:null,blocked:false})});
 afterEach(()=>{disconnect?.();disconnect=undefined;useGame.setState(game,true);useSurfaceWeather.setState(weather,true);useCrewLife.setState(crew,true)});
 it('keeps previews harmless, then applies the selected cloud day and its real system locks',()=>{
  disconnect=connectSurfaceIncidents();const records=structuredClone(useGame.getState().commissioning.training.records);
  useSurfaceWeather.getState().preview(291);expect(baseAlertState(useGame.getState()).active).toBe(false);
  expect(travelToSurfaceSol(291)).toBe(true);
  expect(useSurfaceWeather.getState().sol).toBe(291);expect(useSurfaceWeather.getState().previewSol).toBeNull();
  expect(baseAlertState(useGame.getState()).active).toBe(true);expect(roomSuspended(useGame.getState(),'greenhouse')).toBe(true);
  expect(roomSuspended(useGame.getState(),'solar')).toBe(false);expect(useSurfaceWeather.getState().blocked).toBe(true);
  expect(useGame.getState().commissioning.training.records).toEqual(records);
 });
 it('activates a selected same-sol scenario from a resolved save even without a sol-change subscriber',()=>{
  const s=simulationSnapshot(useGame.getState());s.commissioning.training.incidents={throughSol:318,triggered:['ice-clouds','regional-dust'],active:[],repairs:{}};
  useGame.setState(s);useSurfaceWeather.setState({sol:316});
  expect(travelToSurfaceSol(316)).toBe(true);
  expect(activeSurfaceIncidents(useGame.getState()).map(e=>e.id)).toEqual(['regional-dust']);
  expect(roomSuspended(useGame.getState(),'solar')).toBe(true);expect(useSurfaceWeather.getState().blocked).toBe(true);
  expect(useGame.getState().commissioning.training.incidents?.triggered).toEqual(['ice-clouds','regional-dust']);
 });
 it('preserves every crossed incident on a long jump and refuses a second skip while repairs remain',()=>{
  disconnect=connectSurfaceIncidents();expect(travelToSurfaceSol(574)).toBe(true);
  expect(activeSurfaceIncidents(useGame.getState()).map(e=>e.id)).toEqual(['ice-clouds','regional-dust','dust-c-arrival','dust-c-peak']);
  const before=simulationSnapshot(useGame.getState());expect(travelToSurfaceSol(703)).toBe(false);
  expect(simulationSnapshot(useGame.getState())).toEqual(before);expect(useSurfaceWeather.getState().sol).toBe(574);
 });
 it('does not create an invented fault when explicitly returning to a clear archived day',()=>{
  expect(travelToSurfaceSol(23)).toBe(true);expect(baseAlertState(useGame.getState()).active).toBe(false);
  expect(travelToSurfaceSol(NaN)).toBe(false);
 });
});
