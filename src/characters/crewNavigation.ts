import { CELL, FLOOR, cellKey, type Layout, type Point, type Room } from '../explorer/layout';
import type { Fixture } from '../explorer/fixtures';
export const CREW_RADIUS=.36, NAV_STEP=.5;
export interface NavPoint {x:number;z:number}
export interface CrewNavigation {nodes:Map<string,NavPoint>;layout:Layout;fixtures:Fixture[]}
export const navKey=(p:NavPoint)=>`${Math.round(p.x/NAV_STEP)},${Math.round(p.z/NAV_STEP)}`;
export function clearFloor(l:Layout,fixtures:Fixture[],p:NavPoint,radius=CREW_RADIUS){
 // The entire capsule footprint stays inside pressurized floor, clear of wall ribs.
 for(const dx of [-radius-.12,0,radius+.12])for(const dz of [-radius-.12,0,radius+.12]){
  const x=p.x+dx,z=p.z+dz;if(!l.cells.has(cellKey(Math.round(x/CELL),Math.round(z/CELL))))return false;
  // Crew never enter the pressure chamber, even if a player opens its inner door.
  if(z>l.airlock.innerZ-.7&&Math.abs(x-l.airlock.x)<CELL/2)return false;
 }
 return !fixtures.some(f=>Math.abs(p.x-f.x)<f.width/2+radius+.08&&Math.abs(p.z-f.z)<f.depth/2+radius+.08);
}
export function makeCrewNavigation(layout:Layout,fixtures:Fixture[]):CrewNavigation {
 const candidates=new Map<string,NavPoint>(),nodes=new Map<string,NavPoint>();
 for(const cell of layout.cells){const [x,z]=cell.split(',').map(Number);for(let dx=-3;dx<=3;dx++)for(let dz=-3;dz<=3;dz++){
  const p={x:x*CELL+dx*NAV_STEP,z:z*CELL+dz*NAV_STEP};candidates.set(navKey(p),p);
 }}
 for(const [key,p]of candidates)if(clearFloor(layout,fixtures,p))nodes.set(key,p);
 return {nodes,layout,fixtures};
}
export function nearestNode(nav:CrewNavigation,p:NavPoint,predicate:(p:NavPoint)=>boolean=()=>true):NavPoint|undefined {
 let closest:NavPoint|undefined,distance=Infinity;for(const n of nav.nodes.values()){const d=(n.x-p.x)**2+(n.z-p.z)**2;if(d<distance&&predicate(n)){closest=n;distance=d;}}return closest;
}
const distance=(a:NavPoint,b:NavPoint)=>Math.hypot(a.x-b.x,a.z-b.z);
class Heap {
 values:{key:string;score:number}[]=[];
 push(item:{key:string;score:number}){let i=this.values.length;this.values.push(item);while(i){const parent=(i-1)>>1;if(this.values[parent].score<=item.score)break;this.values[i]=this.values[parent];i=parent;}this.values[i]=item;}
 pop(){const first=this.values[0],last=this.values.pop();if(this.values.length&&last){let i=0;while(i*2+1<this.values.length){let child=i*2+1;if(child+1<this.values.length&&this.values[child+1].score<this.values[child].score)child++;if(last.score<=this.values[child].score)break;this.values[i]=this.values[child];i=child;}this.values[i]=last;}return first;}
}
export function findCrewPath(nav:CrewNavigation,from:NavPoint,to:NavPoint,avoid:NavPoint[]=[]):NavPoint[]{
 const start=nearestNode(nav,from),goal=nearestNode(nav,to);if(!start||!goal)return [];
 const startKey=navKey(start),goalKey=navKey(goal),parents=new Map<string,string>(),costs=new Map([[startKey,0]]),closed=new Set<string>(),heap=new Heap();heap.push({key:startKey,score:distance(start,goal)});
 while(heap.values.length){const {key}=heap.pop();if(closed.has(key))continue;closed.add(key);const p=nav.nodes.get(key)!;
  if(key===goalKey){const path:NavPoint[]=[goal];let k=key;while(parents.has(k)){k=parents.get(k)!;path.push(nav.nodes.get(k)!);}path.reverse();
   // Keep real grid turns; do not smooth a corner through a furnishing.
   return path.filter((p,i)=>i===0||i===path.length-1||(p.x-path[i-1].x)!==(path[i+1].x-p.x)||(p.z-path[i-1].z)!==(path[i+1].z-p.z));
  }
  for(const [dx,dz]of [[NAV_STEP,0],[-NAV_STEP,0],[0,NAV_STEP],[0,-NAV_STEP]]){const n={x:p.x+dx,z:p.z+dz},nk=navKey(n);if(!nav.nodes.has(nk)||closed.has(nk))continue;
   if(nk!==startKey&&avoid.some(a=>distance(n,a)<.85))continue;
   const next=costs.get(key)!+NAV_STEP;if(next>=(costs.get(nk)??Infinity))continue;costs.set(nk,next);parents.set(nk,key);heap.push({key:nk,score:next+Math.abs(n.x-goal.x)+Math.abs(n.z-goal.z)});
  }
 }
 return [];
}
export function clearSegment(nav:CrewNavigation,a:NavPoint,b:NavPoint){const steps=Math.max(1,Math.ceil(distance(a,b)/.2));for(let i=0;i<=steps;i++)if(!clearFloor(nav.layout,nav.fixtures,{x:a.x+(b.x-a.x)*i/steps,z:a.z+(b.z-a.z)*i/steps}))return false;return true;}
export function roomDestination(nav:CrewNavigation,room:Room,index=0):NavPoint {
 const centre={x:room.x*CELL,z:room.z*CELL};return nearestNode(nav,{x:centre.x+(index%3-1)*.75,z:centre.z+(Math.floor(index/3)%3-1)*.75},p=>Math.abs(p.x-centre.x)<(room.radius+.4)*CELL&&Math.abs(p.z-centre.z)<(room.radius+.4)*CELL)??centre;
}
export interface CrewBerth {id:string;fixtureId:string;roomId:string;approach:NavPoint;position:Point;heading:number;level:0|1}
export function crewBerths(nav:CrewNavigation):CrewBerth[]{
 const beds:CrewBerth[]=[];
 for(const f of nav.fixtures.filter(f=>f.type==='bunk')){
  const r=nav.layout.rooms.find(r=>r.id===f.roomId)!;const candidates=[-1,1].map(side=>({x:f.x+Math.cos(f.rotation)*side*(f.size[0]/2+.7),z:f.z-Math.sin(f.rotation)*side*(f.size[0]/2+.7)}));
  const approaches=candidates.map(p=>nearestNode(nav,p)).filter((p):p is NavPoint=>!!p).filter(p=>findCrewPath(nav,roomDestination(nav,r),p).length>0).sort((a,b)=>distance(a,{x:r.x*CELL,z:r.z*CELL})-distance(b,{x:r.x*CELL,z:r.z*CELL}));
  if(!approaches[0])continue;
  for(const level of [0,1] as const){const foot=.92;const position:Point=[f.x+Math.sin(f.rotation)*foot,FLOOR+1.12+level*1.05,f.z+Math.cos(f.rotation)*foot];beds.push({id:`${f.id}-berth-${level}`,fixtureId:f.id,roomId:f.roomId,approach:approaches[0],position,heading:f.rotation,level});}
 }
 // Prefer lower bunks; upper berths are available only after each lower berth is assigned.
 return beds.sort((a,b)=>a.level-b.level||a.id.localeCompare(b.id));
}
