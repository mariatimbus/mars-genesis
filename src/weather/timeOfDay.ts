import { SECONDS_PER_SURFACE_SOL,SURFACE_SOLS,clampSol } from './calendar';

export const DEFAULT_SURFACE_SECONDS=SECONDS_PER_SURFACE_SOL/3; // 08:00
export function migrateSurfaceTime(saved:unknown,version:number,habitatSeconds:number){
 const data=saved&&typeof saved==='object'?saved:{};
 const seconds=Number.isFinite(habitatSeconds)?((habitatSeconds%SECONDS_PER_SURFACE_SOL)+SECONDS_PER_SURFACE_SOL)%SECONDS_PER_SURFACE_SOL:DEFAULT_SURFACE_SECONDS;
 return version<2?{...data,seconds}:data;
}
export function nextTimeOfDay(sol:number,seconds:number,hour:number){
 if(!Number.isFinite(hour)||hour<0||hour>=24||!Number.isFinite(seconds))return null;
 const current=((seconds%SECONDS_PER_SURFACE_SOL)+SECONDS_PER_SURFACE_SOL)%SECONDS_PER_SURFACE_SOL;
 const target=hour/24*SECONDS_PER_SURFACE_SOL;
 if(Math.abs(current-target)<1e-6)return null;
 const day=clampSol(sol)+(target<current?1:0);
 if(day>SURFACE_SOLS)return null;
 return {sol:day,seconds:target};
}
/** Artistic day/night lighting, shared by the visible sun and its light. */
export function daylightProfile(seconds:number){
 const angle=(seconds/SECONDS_PER_SURFACE_SOL-.25)*Math.PI*2;
 const elevation=Math.sin(angle),t=Math.min(1,Math.max(0,(elevation+.12)/.32));
 const x=Math.cos(angle)*110,y=elevation*100,z=-40,length=Math.hypot(x,y,z);
 return {daylight:t*t*(3-2*t),direction:[x/length,y/length,z/length] as [number,number,number]};
}
