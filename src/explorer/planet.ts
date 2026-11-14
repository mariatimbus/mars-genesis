import type { Point } from './layout';

// A compressed fictional Mars-like planet. Surface charts meet at the date line
// and reflect through the poles; terrain is sampled on the same spherical domain.
export const PLANET_CIRCUMFERENCE=32000;
export const PLANET_RADIUS=PLANET_CIRCUMFERENCE/(Math.PI*2);
export const CHUNK_SIZE=100;
export const TERRAIN_STEP=2.5;
export interface Landmark {id:string;name:string;kind:'crater'|'canyon'|'outpost'|'ice'|'volcano'|'wreck';x:number;z:number;radius:number;description:string}
export const LANDMARKS:Landmark[]=[
 {id:'echo',name:'Echo Crater',kind:'crater',x:650,z:530,radius:85,description:'A broad impact basin with a raised rim.'},
 {id:'relay-camp',name:'Horizon Outpost',kind:'outpost',x:-1000,z:850,radius:40,description:'An expedition shelter and survey beacon.'},
 {id:'rift',name:'Ember Rift',kind:'canyon',x:2100,z:1400,radius:210,description:'Long eroded troughs through darker basalt.'},
 {id:'lander',name:'Lost Survey Lander',kind:'wreck',x:-2600,z:-1200,radius:35,description:'A retired robotic lander at an old survey site.'},
 {id:'caldera',name:'Tharsis Caldera',kind:'volcano',x:5700,z:-2300,radius:650,description:'A wide volcanic shield and summit depression.'},
 {id:'aurora',name:'Aurora Basin',kind:'crater',x:-7200,z:3800,radius:320,description:'A remote basin on the western hemisphere.'},
 {id:'far-camp',name:'Far Side Station',kind:'outpost',x:13500,z:-1100,radius:45,description:'An isolated survey station beyond the home hemisphere.'},
 {id:'north-ice',name:'Northern Ice Fields',kind:'ice',x:3200,z:-6900,radius:500,description:'Bright frozen terrain near the northern polar region.'},
 {id:'south-ice',name:'Southern Ice Fields',kind:'ice',x:-4500,z:7000,radius:600,description:'Wind-shaped ice and dust in the southern polar region.'},
];
export function planetDirection(x:number,z:number):Point {
 const lon=x/PLANET_RADIUS,lat=-z/PLANET_RADIUS,c=Math.cos(lat);
 return [Math.sin(lon)*c,Math.sin(lat),Math.cos(lon)*c];
}
export function canonicalPosition(x:number,z:number){
 const d=planetDirection(x,z),lon=Math.atan2(d[0],d[2]),lat=Math.asin(Math.max(-1,Math.min(1,d[1])));
 return {x:lon*PLANET_RADIUS,z:-lat*PLANET_RADIUS,latitude:lat*180/Math.PI,longitude:lon*180/Math.PI,poleFlipped:Math.cos(z/PLANET_RADIUS)<0};
}
export function surfaceDistance(a:{x:number;z:number},b:{x:number;z:number}){
 const u=planetDirection(a.x,a.z),v=planetDirection(b.x,b.z),dot=u.reduce((sum,n,i)=>sum+n*v[i],0);
 return PLANET_RADIUS*Math.acos(Math.max(-1,Math.min(1,dot)));
}
export function formatDistance(m:number){return m>=1000?`${(m/1000).toFixed(1)} km`:`${Math.round(m)} m`}
export function tileKey(x:number,z:number){return `${Math.floor(x/CHUNK_SIZE)},${Math.floor(z/CHUNK_SIZE)}`}
export function visibleTiles(x:number,z:number,radius=3){
 const cx=Math.floor(x/CHUNK_SIZE),cz=Math.floor(z/CHUNK_SIZE),tiles:{x:number;z:number;segments:number;physics:boolean}[]=[];
 for(let dz=-radius;dz<=radius;dz++)for(let dx=-radius;dx<=radius;dx++){
  const distance=Math.max(Math.abs(dx),Math.abs(dz));tiles.push({x:cx+dx,z:cz+dz,segments:distance<=1?40:distance===2?20:10,physics:distance<=1});
 }
 return tiles;
}
const grounds=new WeakMap<object,Map<string,number>>();
export function registerGround(world:object,key:string){
 let set=grounds.get(world);if(!set){set=new Map();grounds.set(world,set)}set.set(key,(set.get(key)??0)+1);
 return ()=>{const count=(set!.get(key)??1)-1;if(count<=0)set!.delete(key);else set!.set(key,count)};
}
export function groundReady(world:object,x:number,z:number,radius=0){
 const set=grounds.get(world);return [-radius,radius].every(dx=>[-radius,radius].every(dz=>set?.has(tileKey(x+dx,z+dz))));
}
export function nearbyLandmarks(x:number,z:number,distance=100){return LANDMARKS.filter(p=>surfaceDistance({x,z},p)<Math.max(distance,p.radius))}

export function surfaceBearing(a:{x:number;z:number},b:{x:number;z:number}){
 const lat1=-a.z/PLANET_RADIUS,lat2=-b.z/PLANET_RADIUS,lon=(b.x-a.x)/PLANET_RADIUS;
 return Math.atan2(Math.sin(lon)*Math.cos(lat2),Math.cos(lat1)*Math.sin(lat2)-Math.sin(lat1)*Math.cos(lat2)*Math.cos(lon));
}
