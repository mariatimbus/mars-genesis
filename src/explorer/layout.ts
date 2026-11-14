import type { Building, Kind } from '../simulation/engine';
export const CELL=3, FLOOR=.35, EYE_HEIGHT=1.6;
export type Point=[number,number,number];
export interface Room {id:string;buildingId:string;kind:Kind;x:number;z:number;radius:number;name:string}
export interface Door {id:string;x:number;z:number;axis:'x'|'z';airlock?:'inner'|'outer'}
export interface Layout {rooms:Room[];cells:Set<string>;hall:Set<string>;walkways:Set<string>;doors:Door[];habitat:Room;spawn:Point;airlock:{x:number;innerZ:number;outerZ:number;centerZ:number};relay:Point}
export const cellKey=(x:number,z:number)=>`${x},${z}`;
const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
export function makeLayout(buildings:Building[]):Layout {
 const names:Record<Kind,string>={habitat:'CREW HABITAT',greenhouse:'GREENHOUSE',research:'RESEARCH LAB',oxygen:'OXYGEN PROCESSING',solar:'POWER STATION',water:'WATER RECOVERY',medical:'MEDICAL BAY',storage:'SUPPLY DEPOT'};
 const rooms:Room[]=buildings.filter(b=>b.kind!=='solar').map(b=>({id:b.id,buildingId:b.id,kind:b.kind,x:Math.round(b.x),z:Math.round(b.z),radius:b.kind==='habitat'||b.kind==='greenhouse'?2:1,name:names[b.kind]}));
 const solar=buildings.find(b=>b.kind==='solar');if(solar)rooms.push({id:'power-station',buildingId:solar.id,kind:'solar',x:Math.round(solar.x),z:Math.round(solar.z)-4,radius:1,name:names.solar});
 const habitat=rooms.find(r=>r.kind==='habitat')??rooms[0];
 const cells=new Set<string>(),hall=new Set<string>(),walkways=new Set<string>(),roomCells=new Map<string,string>();
 for(const r of rooms)for(let x=r.x-r.radius;x<=r.x+r.radius;x++)for(let z=r.z-r.radius;z<=r.z+r.radius;z++){cells.add(cellKey(x,z));roomCells.set(cellKey(x,z),r.id)}
 // A connected, axis-aligned circulation network. Room shells and corridor walls use the same grid.
 for(const r of rooms){let x=r.x,z=r.z;walkways.add(cellKey(x,z));const route=(nx:number,nz:number)=>{x=nx;z=nz;walkways.add(cellKey(x,z));cells.add(cellKey(x,z));if(!roomCells.has(cellKey(x,z)))hall.add(cellKey(x,z));};
  // Northern rooms must join beside the habitat, never through its pressure chamber.
  // The dedicated airlock spine is added below after interior circulation is built.
  const north=r.z-r.radius>habitat.z+habitat.radius;
  const trunk=north?habitat.x+(r.x>=habitat.x?1:-1)*(habitat.radius+2):habitat.x;
  while(x!==trunk){route(x+Math.sign(trunk-x),z)}while(z!==habitat.z){route(x,z+Math.sign(habitat.z-z))}
  while(x!==habitat.x){route(x+Math.sign(habitat.x-x),z)}
 }
 const doors:Door[]=[];const seen=new Set<string>();
 for(const r of rooms)for(let x=r.x-r.radius;x<=r.x+r.radius;x++)for(let z=r.z-r.radius;z<=r.z+r.radius;z++)for(const [dx,dz]of dirs){const n=cellKey(x+dx,z+dz);if(cells.has(n)&&!roomCells.has(n)){
  const id=`door-${r.id}-${x}-${z}-${dx}-${dz}`;const edge=`${x+dx*.5},${z+dz*.5}`;if(!seen.has(edge)){seen.add(edge);doors.push({id,x:(x+dx*.5)*CELL,z:(z+dz*.5)*CELL,axis:dx?'x':'z'})}
 }}
 const x=habitat.x,edge=habitat.z+habitat.radius;
 for(let z=habitat.z+1;z<=edge+4;z++){cells.add(cellKey(x,z));if(z>edge)hall.add(cellKey(x,z));walkways.add(cellKey(x,z))}
 const airlock={x:x*CELL,innerZ:(edge+2.5)*CELL,outerZ:(edge+4.5)*CELL,centerZ:(edge+3.5)*CELL};
 doors.push({id:'airlock-inner',x:airlock.x,z:airlock.innerZ,axis:'z',airlock:'inner'},{id:'airlock-outer',x:airlock.x,z:airlock.outerZ,axis:'z',airlock:'outer'});
 return {rooms,cells,hall,walkways,doors,habitat,spawn:[habitat.x*CELL,FLOOR+1,habitat.z*CELL+1],airlock,relay:[airlock.x+5,FLOOR,airlock.outerZ+7]};
}
export function cellAt(p:Point){return cellKey(Math.round(p[0]/CELL),Math.round(p[2]/CELL))}
export function inAirlock(l:Layout,p:Point){return Math.abs(p[0]-l.airlock.x)<1.5&&p[2]>l.airlock.innerZ&&p[2]<l.airlock.outerZ}
export function roomAt(l:Layout,p:Point){return l.rooms.find(r=>Math.abs(p[0]-r.x*CELL)<(r.radius+.5)*CELL&&Math.abs(p[2]-r.z*CELL)<(r.radius+.5)*CELL)}
export function environmentAt(l:Layout,p:Point,pressure:number,support:boolean){
 if(inAirlock(l,p))return pressure>=.99?'Airlock · pressurized':'Airlock · vacuum';
 if(l.cells.has(cellAt(p)))return support?(roomAt(l,p)?.name??'PRESSURIZED CORRIDOR'):'LIFE SUPPORT OFFLINE';
 return 'MARS SURFACE';
}

// Internal passageways start open; airlock doors always start sealed.
export const doorIsOpen=(d:Door,doors:Record<string,boolean>)=>doors[d.id]??!d.airlock;
