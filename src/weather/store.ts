import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { advanceSurfaceClock,clampSol,nextImportantWeather } from './calendar';
import { DEFAULT_SURFACE_SECONDS,nextTimeOfDay,migrateSurfaceTime } from './timeOfDay';
import { useCrewLife } from '../characters/crewStore';
interface SurfaceWeatherState {
 sol:number;seconds:number;missionSol:number;missionSeed:number|null;previewSol:number|null;blocked:boolean;
 tick:(dt:number)=>void;preview:(sol:number|null)=>void;continueFrom:(sol:number)=>void;skipToNextEvent:()=>void;skipToHour:(hour:number)=>void;syncMission:(sol:number,seed:number)=>void;
}
export const useSurfaceWeather=create<SurfaceWeatherState>()(persist((set)=>({
 sol:1,seconds:DEFAULT_SURFACE_SECONDS,missionSol:1,missionSeed:null,previewSol:null,blocked:false,
 tick:dt=>set(s=>s.blocked?s:advanceSurfaceClock(s.sol,s.seconds,dt)),
 preview:sol=>set({previewSol:sol===null?null:clampSol(sol)}),
 continueFrom:sol=>set(s=>s.blocked?s:{sol:clampSol(sol),seconds:0,previewSol:null}),
 skipToNextEvent:()=>set(s=>{const event=nextImportantWeather(s.sol);return event&&!s.blocked?{sol:event.sol,seconds:0,previewSol:null}:s}),
 skipToHour:hour=>set(s=>{
  if(s.blocked)return s;
  const target=nextTimeOfDay(s.sol,s.seconds,hour);if(!target)return s;
  // Stop at the start of an important day, so sleeping cannot bypass a fault.
  const event=nextImportantWeather(s.sol);
  return {...(event&&event.sol<=target.sol?{sol:event.sol,seconds:0}:target),previewSol:null};
 }),
 syncMission:(sol,seed)=>set(s=>{
  if(s.missionSeed!==null&&(s.missionSeed!==seed||sol<s.missionSol))return {sol:clampSol(sol),seconds:DEFAULT_SURFACE_SECONDS,missionSol:sol,missionSeed:seed,previewSol:null};
  return {sol:clampSol(s.sol+Math.max(0,sol-s.missionSol)),missionSol:sol,missionSeed:seed};
 }),
}),{name:'ares-one-surface-weather',version:2,migrate:(saved,version)=>migrateSurfaceTime(saved,version,useCrewLife.getState().seconds),partialize:s=>({sol:s.sol,seconds:s.seconds,missionSol:s.missionSol,missionSeed:s.missionSeed}),merge:(saved,current)=>{
 const s=saved as Partial<SurfaceWeatherState>;
 return {...current,sol:clampSol(s.sol??1),seconds:Number.isFinite(s.seconds)?Math.max(0,s.seconds!)%720:DEFAULT_SURFACE_SECONDS,missionSol:clampSol(s.missionSol??1),missionSeed:typeof s.missionSeed==='number'?s.missionSeed:null,previewSol:null};
}}));
