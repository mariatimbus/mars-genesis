export type Vec3 = [number,number,number];
export const FLIGHT_DURATION_SECONDS=12;
export const MISSION_TRAVEL_DAYS=210; // Fictional mission choice: roughly seven months, not NASA ephemerides.
export const CHAPTER_STARTS=[0,.18,.72,.9] as const;
export const EARTH_POSITION:Vec3=[-18,-1,-4];
export const MARS_POSITION:Vec3=[22,0,-8];
export const EARTH_RADIUS=4.6;
export const MARS_RADIUS=3.4;
export const clamp01=(p:number)=>Math.max(0,Math.min(1,Number.isFinite(p)?p:0));
const add=(a:Vec3,b:Vec3):Vec3=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const scale=(a:Vec3,n:number):Vec3=>[a[0]*n,a[1]*n,a[2]*n];
const mix=(a:Vec3,b:Vec3,t:number):Vec3=>add(scale(a,1-t),scale(b,t));
export const normalized=(v:Vec3):Vec3=>{const m=Math.hypot(...v)||1;return scale(v,1/m)};
export const LAUNCH_NORMAL=normalized([.6,.8,.04]);
export const LANDING_NORMAL=normalized([-.6,.4,.7]);
export const LAUNCH_SURFACE=add(EARTH_POSITION,scale(LAUNCH_NORMAL,EARTH_RADIUS));
export const LANDING_SURFACE=add(MARS_POSITION,scale(LANDING_NORMAL,MARS_RADIUS));
const launch=add(LAUNCH_SURFACE,scale(LAUNCH_NORMAL,.8));
const departure=add(EARTH_POSITION,scale(LAUNCH_NORMAL,EARTH_RADIUS+5));
const approach:Vec3=[12,7,1];
const descent=add(LANDING_SURFACE,scale(LANDING_NORMAL,3));
const landed=add(LANDING_SURFACE,scale(LANDING_NORMAL,.8));
function cubic(a:Vec3,b:Vec3,c:Vec3,d:Vec3,t:number):Vec3 {
 const q=1-t;return [0,1,2].map(i=>q*q*q*a[i]+3*q*q*t*b[i]+3*q*t*t*c[i]+t*t*t*d[i]) as Vec3;
}
export function flightPosition(progress:number):Vec3 {
 const p=clamp01(progress);
 if(p<.18)return cubic(launch,add(launch,scale(LAUNCH_NORMAL,2)),add(departure,[-1,-1,0]),departure,p/.18);
 if(p<.72)return cubic(departure,[-5,14,-9],[6,13,-12],approach,(p-.18)/.54);
 if(p<.9)return cubic(approach,[16,7,2],add(descent,scale(LANDING_NORMAL,2)),descent,(p-.72)/.18);
 const t=(p-.9)/.1;return mix(descent,landed,t*t*(3-2*t));
}
export function flightPose(progress:number){
 const p=clamp01(progress),position=flightPosition(p);
 const a=flightPosition(Math.max(0,p-.001)),b=flightPosition(Math.min(1,p+.001));
 const tangent=normalized([b[0]-a[0],b[1]-a[1],b[2]-a[2]]);
 const t=clamp01((p-.78)/.12),blend=t*t*(3-2*t);
 return {position,direction:p>=.9?LANDING_NORMAL:normalized(mix(tangent,LANDING_NORMAL,blend))};
}
export function flightChapter(progress:number){const p=clamp01(progress);return p<.18?0:p<.72?1:p<.9?2:3;}
export function elapsedEarthDays(progress:number){
 const p=clamp01(progress);
 if(p<.18)return p/.18*.02;
 if(p<.9)return .02+(p-.18)/.72*(MISSION_TRAVEL_DAYS-.03);
 return MISSION_TRAVEL_DAYS-.01+(p-.9)/.1*.01;
}
export function enginePower(progress:number){const p=clamp01(progress);return p<.2?1:p<.72?0:p<.83?.35:p<.9?0:p<1?.7:0;}
export function advanceFlight(progress:number,elapsedSeconds:number,endAt=1){return Math.min(clamp01(endAt),clamp01(progress+Math.max(0,elapsedSeconds)/FLIGHT_DURATION_SECONDS))};
