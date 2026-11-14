import type { LandPlot } from '../game/worldConfig';
import { canonicalPosition, planetDirection, surfaceDistance, LANDMARKS } from './planet';

export const CRATERS = [
 {x:78,z:82,radius:19,depth:2.2},
 {x:-103,z:-54,radius:26,depth:3},
 {x:98,z:-104,radius:16,depth:1.8},
];
const smooth=(t:number)=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
function noise(x:number,z:number){
 const ix=Math.floor(x),iz=Math.floor(z),u=smooth(x-ix),v=smooth(z-iz);
 const hash=(a:number,b:number)=>{const n=Math.sin(a*127.1+b*311.7)*43758.5453;return n-Math.floor(n)};
 return (hash(ix,iz)*(1-u)+hash(ix+1,iz)*u)*(1-v)+(hash(ix,iz+1)*(1-u)+hash(ix+1,iz+1)*u)*v;
}
export function marsSurfaceHeight(x:number,z:number,plots:LandPlot[]=[]){
 const canonical=canonicalPosition(x,z);x=canonical.x;z=canonical.z;
 const direction=planetDirection(x,z),[nx,ny,nz]=direction;
 // Periodic spherical sampling keeps the date line and both poles continuous.
 const macro=noise(nx*9+nz*3,ny*9+nz*5),detail=noise(nx*35+ny*7,nz*35+ny*19);
 const polar=Math.abs(ny),distance=surfaceDistance({x,z},{x:0,z:0});
 let global=35+macro*100+detail*16+12*Math.sin(nx*33+nz*14)*Math.sin(ny*16);
 for(const site of LANDMARKS){const d=surfaceDistance({x,z},site),q=d/site.radius;
  if(site.kind==='crater')global+=18*Math.exp(-(((q-1)*6)**2))-28*Math.max(0,1-q*q)**2;
  if(site.kind==='volcano')global+=210*Math.exp(-q*q*1.2)-70*Math.exp(-q*q*28);
  if(site.kind==='canyon')global-=45*Math.exp(-q*q*2);
 }
 if(polar>.94)global=global*.35+14;
 const distant=smooth((distance-220)/180);
 if(distant>=1)return global;

 const edge=smooth((Math.hypot(x*.95,z)-65)/90);
 let height=edge*(7+20*noise(x*.009,z*.009)+8*noise(x*.026,z*.026));
 height+=.9*(noise(x*.045,z*.045)-.5)+.12*Math.sin(x*.7+z*.34)*Math.sin(z*.28);
 for(const c of CRATERS){const d=Math.hypot(x-c.x,z-c.z),bowl=Math.max(0,1-(d/c.radius)**2);
  height+=c.depth*.7*Math.exp(-(((d-c.radius)/2.8)**2))-c.depth*bowl*bowl;
 }
 let flatten=0;
 for(const p of plots){const distance=Math.hypot(Math.max(p.minX*3-x,0,x-p.maxX*3),Math.max(p.minZ*3-z,0,z-p.maxZ*3));flatten=Math.max(flatten,smooth(1-distance/6))}
 const local=height*(1-flatten)+.06*Math.sin(x*.27)*Math.cos(z*.2)*flatten;
 return local*(1-distant)+global*distant;
}
export function seededRandom(seed:number){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}}
