import { describe,it,expect,beforeEach } from 'vitest';
import { SURFACE_CALENDAR,WEATHER_SOURCES,advanceSurfaceClock,surfaceWeather,atmosphereSheltered,nextImportantWeather } from './calendar';
import { useSurfaceWeather } from './store';
import { useGame,simulationSnapshot } from '../store/game';

describe('science-informed exterior calendar',()=>{
 it('covers all 720 sols with stable, bounded visual profiles and traceable provenance',()=>{
  expect(SURFACE_CALENDAR).toHaveLength(720);
  SURFACE_CALENDAR.forEach((day,i)=>{
   expect(day.sol).toBe(i+1);expect(surfaceWeather(i+1)).toBe(day);
   for(const v of [day.dust,day.cloud,day.wind]){expect(v).toBeGreaterThanOrEqual(0);expect(v).toBeLessThanOrEqual(1)}
   expect(Number.isFinite(day.heading)).toBe(true);expect(WEATHER_SOURCES[day.source].url).toMatch(/^https:\/\//);
   expect(day.basis).toBe(day.reference?'archived-period':'seasonal-model');
  });
  expect(new Set(SURFACE_CALENDAR.map(w=>`${w.dust}:${w.cloud}:${w.wind}`)).size).toBe(720);
  expect(surfaceWeather(0).sol).toBe(1);expect(surfaceWeather(999).sol).toBe(720);expect(surfaceWeather(NaN).sol).toBe(1);
 });
 it('uses local documented cloud and storm windows without inventing a storm for a pressure anomaly',()=>{
  expect(surfaceWeather(291).cloud).toBeGreaterThan(.65);
  for(const sol of [313,316,318,571,574])expect(surfaceWeather(sol).dust).toBeGreaterThan(.6);
  expect(surfaceWeather(574).dust).toBeGreaterThan(surfaceWeather(571).dust);
  expect(surfaceWeather(620).dust).toBeGreaterThan(surfaceWeather(1).dust);
  expect(surfaceWeather(703).reference?.effect).toBe('pressure');expect(surfaceWeather(703).dust).toBeLessThan(.4);
  expect(surfaceWeather(312).basis).toBe('seasonal-model');expect(surfaceWeather(575).basis).toBe('seasonal-model');
 });
 it('advances at a bounded sol boundary and cannot escape the 720-sol calendar',()=>{
  expect(advanceSurfaceClock(1,719,.5)).toEqual({sol:1,seconds:719.5});
  expect(advanceSurfaceClock(1,719,1.5)).toEqual({sol:2,seconds:.5});
  expect(advanceSurfaceClock(1,0,720*719)).toEqual({sol:720,seconds:0});
  expect(advanceSurfaceClock(720,719,2000)).toEqual({sol:720,seconds:720-1e-6});
  expect(advanceSurfaceClock(1,0,-10)).toEqual({sol:1,seconds:0});
 });
 it('masks sheltered floor cells, including corridors, but leaves the sky and exterior exposed',()=>{
  const cells=new Set(['0,0','1,0']);
  expect(atmosphereSheltered(cells,0,1.9,0)).toBe(true);
  expect(atmosphereSheltered(cells,3,2,0)).toBe(true);
  expect(atmosphereSheltered(cells,0,16,0)).toBe(false);
  expect(atmosphereSheltered(cells,8,1,0)).toBe(false);
 });
});
describe('independent surface clock and preview',()=>{
 beforeEach(()=>useSurfaceWeather.setState({sol:1,seconds:0,missionSol:1,missionSeed:null,previewSol:null}));
 it('previews and commits a distant sol without advancing mission resources, crew or challenges',()=>{
  const before=simulationSnapshot(useGame.getState());
  useSurfaceWeather.getState().preview(574);
  expect(useSurfaceWeather.getState().sol).toBe(1);
  useSurfaceWeather.getState().continueFrom(574);
  expect(useSurfaceWeather.getState().previewSol).toBeNull();expect(useSurfaceWeather.getState().sol).toBe(574);
  useSurfaceWeather.getState().tick(720);
  expect(useSurfaceWeather.getState().sol).toBe(575);
  expect(simulationSnapshot(useGame.getState())).toEqual(before);
 });
 it('counts a mission advance once, preserves exploration progress and resets for a new scenario',()=>{
  const s=()=>useSurfaceWeather.getState();
  s().syncMission(1,42);s().tick(720*10);s().syncMission(2,42);s().syncMission(2,42);
  expect(s().sol).toBe(12);
  s().syncMission(1,73);expect(s().sol).toBe(1);expect(s().seconds).toBe(240);
 });
 it('skips forward through documented events, including the measured dust-C peak, without wrapping or changing the mission',()=>{
  const before=simulationSnapshot(useGame.getState()),s=()=>useSurfaceWeather.getState(),visited:number[]=[];
  s().continueFrom(1);
  while(nextImportantWeather(s().sol)){const previous=s().sol;s().skipToNextEvent();expect(s().sol).toBeGreaterThan(previous);expect(s().seconds).toBe(0);visited.push(s().sol)}
  expect(visited).toEqual([284,313,571,574,600,703]);
  s().skipToNextEvent();expect(s().sol).toBe(703);expect(nextImportantWeather(720)).toBeNull();
  expect(simulationSnapshot(useGame.getState())).toEqual(before);
 });
});
