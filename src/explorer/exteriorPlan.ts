import type { Building } from '../simulation/engine';
import { CELL, type Layout, type Point } from './layout';
import { exteriorClear, solarPlacements, overlaps, type Footprint } from './fixtures';
import { seededRandom } from './terrain';

export interface Site extends Footprint {id:string;kind:'landing'|'comms'|'cargo'|'weather';label:string}
export interface Route {id:string;points:Point[]}
export interface Rock extends Footprint {scale:Point;rotation:Point;solid:boolean}
export function routeSamples(route:Route,spacing=1):Point[]{
 const samples:Point[]=[];
 for(let i=1;i<route.points.length;i++){const a=route.points[i-1],b=route.points[i],count=Math.ceil(Math.hypot(b[0]-a[0],b[2]-a[2])/spacing);
  for(let j=0;j<count;j++){const t=j/count;samples.push([a[0]+(b[0]-a[0])*t,0,a[2]+(b[2]-a[2])*t])}
 }
 samples.push(route.points[route.points.length-1]);return samples;
}
export function exteriorPlan(l:Layout,buildings:Building[]){
 const arrays=solarPlacements(l,buildings),sites:Site[]=[],routes:Route[]=[];
 const start:Point=[l.airlock.x,0,l.airlock.outerZ+3];
 const cells=[...l.cells].map(k=>{const [x,z]=k.split(',').map(Number);return {x:x*CELL,z:z*CELL,width:CELL,depth:CELL}});
 const relay={x:l.relay[0],z:l.relay[2],width:2,depth:2};
 const relayRoute:Route={id:'relay',points:[[l.airlock.x,0,l.airlock.outerZ+.3],start,[l.relay[0],0,l.relay[2]-1.6]]};
 routes.push(relayRoute);
 const clearRoute=(route:Route)=>routeSamples(route).every(([x,,z])=>!cells.some(c=>overlaps(c,{x,z,width:3.4,depth:3.4}))&&!arrays.some(a=>overlaps(a,{x,z,width:3.4,depth:3.4},.5))&&!overlaps(relay,{x,z,width:3.4,depth:3.4},.3));
 const clearSite=(p:Footprint)=>exteriorClear(l,p,2)&&arrays.every(a=>!overlaps(a,p,2))&&sites.every(s=>!overlaps(s,p,3));
 for(const distance of [25,33,42,52]){
  for(const angle of [-.65,-1,-.3,.65,1,0]){
   const site:Site={id:'landing',kind:'landing',label:'ROVER / LANDING ZONE',x:start[0]+Math.sin(angle)*distance,z:start[2]+Math.cos(angle)*distance,width:16,depth:16};
   const approach:Point=[site.x,0,site.z-6],route:Route={id:'landing',points:[start,approach]};
   if(clearSite(site)&&clearRoute(route)){sites.push(site);routes.push(route);break}
  }
  if(sites.length)break;
 }
 const pathZones=()=>routes.flatMap(r=>routeSamples(r).map(([x,,z])=>({x,z,width:3.6,depth:3.6})));
 const specs=[{kind:'comms',label:'DEEP SPACE COMMS',width:7,depth:7,dx:19,dz:17},{kind:'cargo',label:'SURFACE LOGISTICS',width:8,depth:6,dx:-16,dz:12},{kind:'weather',label:'WEATHER STATION',width:4,depth:4,dx:13,dz:30}] as const;
 for(const s of specs){let found=false;
  for(let ring=0;ring<9&&!found;ring++)for(let i=0;i<(ring?12:1)&&!found;i++){
   const angle=i*Math.PI/6,site:Site={id:s.kind,kind:s.kind,label:s.label,width:s.width,depth:s.depth,x:start[0]+s.dx+Math.cos(angle)*ring*4,z:start[2]+s.dz+Math.sin(angle)*ring*4};
   if(clearSite(site)&&pathZones().every(p=>!overlaps(site,p,1))){sites.push(site);found=true}
  }
 }
 const random=seededRandom(202611),rocks:Rock[]=[],zones=pathZones();
 for(let i=0;i<560;i++){
  const angle=random()*Math.PI*2,radius=22+Math.sqrt(random())*170,x=Math.cos(angle)*radius,z=Math.sin(angle)*radius;
  const size=i<70?.7+random()*1.5:.1+random()*.42;
  const scale:Point=[size*(1+random()*.6),size*(.45+random()*.4),size*(.8+random()*.6)],foot={x,z,width:Math.max(...scale)*2.5,depth:Math.max(...scale)*2.5};
  if(!exteriorClear(l,foot,.8)||arrays.some(a=>overlaps(a,foot,1))||sites.some(a=>overlaps(a,foot,1))||zones.some(a=>overlaps(a,foot,.8)))continue;
  rocks.push({...foot,scale,rotation:[random()*.4,random()*Math.PI*2,random()*.3],solid:size>.65});
 }
 return {arrays,sites,routes,rocks};
}

export function airlockRamp(l:Layout){
 const x=l.airlock.x,z=l.airlock.outerZ,near=z-.2,far=z+2.4;
 // The exit apron is flattened to -0.08 m; the interior floor is at 0.35 m.
 const vertices=new Float32Array([x-1.3,.36,near,x+1.3,.36,near,x-1.3,-.065,far,x+1.3,-.065,far,x-1.3,.18,near,x+1.3,.18,near,x-1.3,-.2,far,x+1.3,-.2,far]);
 const indices=[0,2,1,1,2,3,4,5,6,5,7,6,0,1,4,1,5,4,2,6,3,3,6,7,0,4,2,2,4,6,1,3,5,3,7,5];
 return {vertices,indices};
}
