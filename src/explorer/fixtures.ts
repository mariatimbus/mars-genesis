import { CELL, FLOOR, type Layout, type Room, type Point } from './layout';
import type { LandPlot } from '../game/worldConfig';
import { marsSurfaceHeight } from './terrain';
import type { Building } from '../simulation/engine';

export interface Footprint {x:number;z:number;width:number;depth:number;access?:Footprint}
export interface Fixture extends Footprint {
 id:string;roomId:string;type:'terminal'|'bunk'|'suit'|'planter'|'tank'|'bench'|'rack'|'bed'|'cabinet'|'shelf'|'crew';
 position:Point;size:Point;rotation:number;
}
export const overlaps=(a:Footprint,b:Footprint,margin=0)=>Math.abs(a.x-b.x)<(a.width+b.width)/2+margin-1e-6&&Math.abs(a.z-b.z)<(a.depth+b.depth)/2+margin-1e-6;
export function circulation(l:Layout):Footprint[]{
 const result:Footprint[]=[];
 for(const key of l.walkways){const [x,z]=key.split(',').map(Number);
  result.push({x:x*CELL,z:z*CELL,width:2.1,depth:2.1});
  for(const [dx,dz] of [[1,0],[0,1]])if(l.walkways.has(`${x+dx},${z+dz}`))result.push({x:(x+dx/2)*CELL,z:(z+dz/2)*CELL,width:dx?CELL:2.1,depth:dz?CELL:2.1});
 }
 return result;
}
export function placeFixture(l:Layout,r:Room,type:Fixture['type'],size:Point,occupied:Footprint[],id:string):Fixture|undefined {
 const half=(r.radius+.5)*CELL-.25,roads=circulation(l);
 // Face each bay inward. Search corners first so the room centre stays open.
 const offsets=Array.from({length:Math.floor(half*4)+1},(_,i)=>-half+i*.5).sort((a,b)=>Math.abs(b)-Math.abs(a));
 for(const rotation of [Math.PI,0,Math.PI/2,-Math.PI/2]){
  const turned=Math.abs(Math.sin(rotation))>.5,width=turned?size[2]:size[0],depth=turned?size[0]:size[2];
  for(const offset of offsets){const x=r.x*CELL+(turned?(rotation>0?-1:1)*(half-width/2):offset),z=r.z*CELL+(turned?offset:(rotation===0?-1:1)*(half-depth/2));
   const p={x,z,width,depth};
   if(Math.abs(x-r.x*CELL)+width/2>half+.001||Math.abs(z-r.z*CELL)+depth/2>half+.001)continue;
   const interactive=type==='terminal'||type==='suit'||type==='crew';
   const access:Footprint|undefined=interactive?{x:x+Math.sin(rotation)*(size[2]/2+.8),z:z+Math.cos(rotation)*(size[2]/2+.8),width:turned?1.2:1.1,depth:turned?1.1:1.2}:undefined;
   if(roads.some(a=>overlaps(a,p,.12))||occupied.some(a=>overlaps(a,p,.18)||(a.access&&overlaps(a.access,p,.1))))continue;
   if(access&&(Math.abs(access.x-r.x*CELL)+access.width/2>half||Math.abs(access.z-r.z*CELL)+access.depth/2>half||occupied.some(a=>overlaps(a,access,.1))))continue;
   // A furnishing must never protrude into another room's shell.
   const fixture:Fixture={...p,access,id,roomId:r.id,type,position:[x,FLOOR,z],size,rotation};occupied.push(fixture);return fixture;
  }
 }
}
export function makeFixtures(l:Layout):Fixture[]{
 const result:Fixture[]=[],occupied:Footprint[]=[];
 for(const r of l.rooms){
  const add=(type:Fixture['type'],size:Point,n=1)=>{for(let i=0;i<n;i++){const f=placeFixture(l,r,type,size,occupied,`${r.id}-${type}-${i}`);if(f)result.push(f)}};
  add('terminal',[1.25,1.85,.4]);
  if(r.kind==='habitat'){add('suit',[1.4,2.2,1.25]);add('bunk',[1.8,2.15,3.2],2);add('cabinet',[1.1,2,1.2]);}
  if(r.kind==='greenhouse')add('planter',[2.3,1.85,5],2);
  if(r.kind==='oxygen'||r.kind==='water')add('tank',[1.5,2.5,1.6],2);
  if(r.kind==='research')add('bench',[1.4,2,2.5],2);
  if(r.kind==='solar')add('rack',[2.5,2.4,1.1],2);
  if(r.kind==='medical'){add('bed',[1.9,1.6,3]);add('cabinet',[1,2,1.5]);}
  if(r.kind==='storage')add('shelf',[1.2,2.4,2.5],2);
 }
 return result;
}
export function crewFixture(l:Layout,r:Room,occupied:Footprint[],id:string){return placeFixture(l,r,'crew',[1,2,1],occupied,id)}

export function exteriorClear(l:Layout,p:Footprint,margin=1){
 if([...l.cells].some(key=>{const [x,z]=key.split(',').map(Number);return overlaps(p,{x:x*CELL,z:z*CELL,width:CELL,depth:CELL},margin)}))return false;
 // Keep the entire exit apron and the short EVA route to the relay unobstructed.
 return !overlaps(p,{x:(l.airlock.x+l.relay[0])/2,z:(l.airlock.outerZ+l.relay[2])/2,width:Math.abs(l.relay[0]-l.airlock.x)+4,depth:Math.abs(l.relay[2]-l.airlock.outerZ)+4},margin);
}
export function solarPlacements(l:Layout,buildings:Building[]){
 const result:(Footprint&{building:Building})[]=[];
 for(const b of buildings.filter(b=>b.kind==='solar')){
  const candidates:Point[]=[[b.x*CELL,0,b.z*CELL]];
  for(let ring=1;ring<=40;ring++)for(let dx=-ring;dx<=ring;dx++)for(let dz=-ring;dz<=ring;dz++)if(Math.max(Math.abs(dx),Math.abs(dz))===ring)candidates.push([(b.x+dx)*CELL,0,(b.z+dz)*CELL]);
  const found=candidates.find(([x,,z])=>{const p={x,z,width:15,depth:17};return exteriorClear(l,p)&&result.every(a=>!overlaps(a,p,1))});
  if(found)result.push({x:found[0],z:found[2],width:15,depth:17,building:b});
 }
 return result;
}
export function terrainHeight(l:Layout,x:number,z:number,plots:LandPlot[]=[]){
 const ix=Math.round(x/CELL),iz=Math.round(z/CELL);let distance=Infinity;
 for(let dx=-3;dx<=3;dx++)for(let dz=-3;dz<=3;dz++)if(l.cells.has(`${ix+dx},${iz+dz}`)){
  distance=Math.min(distance,Math.hypot(Math.max(0,Math.abs(x-(ix+dx)*CELL)-CELL/2),Math.max(0,Math.abs(z-(iz+dz)*CELL)-CELL/2)));
 }
 const apron={x:(l.airlock.x+l.relay[0])/2,z:(l.airlock.outerZ+l.relay[2])/2,width:Math.abs(l.relay[0]-l.airlock.x)+4,depth:Math.abs(l.relay[2]-l.airlock.outerZ)+4};
 distance=Math.min(distance,Math.hypot(Math.max(0,Math.abs(x-apron.x)-apron.width/2),Math.max(0,Math.abs(z-apron.z)-apron.depth/2)));
 // The flat skirt extends past a whole terrain triangle, so interpolation
 // cannot raise the terrain through floors along the edge of a remote base.
 const t=Math.max(0,1-Math.max(0,distance-CELL*1.5)/CELL),blend=t*t*(3-2*t);
 return marsSurfaceHeight(x,z,plots)*(1-blend)-.08*blend;
}

/** Interpolate the exact 2.5 m terrain triangles for decals, feet and surface equipment. */
export function meshGroundHeight(l:Layout,x:number,z:number,plots:LandPlot[]=[]){
 const step=2.5,x0=Math.floor((x+225)/step)*step-225,z0=Math.floor((z+225)/step)*step-225,u=(x-x0)/step,v=(z-z0)/step;
 const a=terrainHeight(l,x0,z0,plots),b=terrainHeight(l,x0,z0+step,plots),c=terrainHeight(l,x0+step,z0+step,plots),d=terrainHeight(l,x0+step,z0,plots);
 return u+v<=1?a+(d-a)*u+(b-a)*v:c+(b-c)*(1-u)+(d-c)*(1-v);
}
