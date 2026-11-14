import { CELL, cellKey, type Layout, type Point } from './layout';
import type { Site } from './exteriorPlan';
export interface TacticalView {x:number;z:number;size:number;unit:number;following:boolean}
/** One floor shape and perimeter-only walls: no grid seams inside corridors. */
export function tacticalFloor(l:Layout){
 let floor='',walls='';
 for(const key of l.cells){const [x,z]=key.split(',').map(Number),left=(x-.5)*CELL,top=(z-.5)*CELL;
  floor+=`M${left},${top}h${CELL}v${CELL}h${-CELL}Z`;
  if(!l.cells.has(cellKey(x,z-1)))walls+=`M${left},${top}h${CELL}`;
  if(!l.cells.has(cellKey(x+1,z)))walls+=`M${left+CELL},${top}v${CELL}`;
  if(!l.cells.has(cellKey(x,z+1)))walls+=`M${left},${top+CELL}h${CELL}`;
  if(!l.cells.has(cellKey(x-1,z)))walls+=`M${left},${top}v${CELL}`;
 }
 return {floor,walls};
}
export function tacticalView(l:Layout,sites:Pick<Site,'x'|'z'|'width'|'depth'>[],position:Point,expanded:boolean):TacticalView {
 const follow=():TacticalView=>{const size=expanded?700:200;return {x:position[0]-size/2,z:position[2]-size/2,size,unit:size/280,following:true}};
 if(Math.hypot(position[0]-l.habitat.x*CELL,position[2]-l.habitat.z*CELL)>180)return follow();
 const points=[...l.cells].map(k=>{const [x,z]=k.split(',').map(Number);return {x:x*CELL,z:z*CELL}});
 const xs=[...points.map(p=>p.x-CELL/2),...points.map(p=>p.x+CELL/2),...sites.flatMap(s=>[s.x-s.width/2,s.x+s.width/2]),l.relay[0]],zs=[...points.map(p=>p.z-CELL/2),...points.map(p=>p.z+CELL/2),...sites.flatMap(s=>[s.z-s.depth/2,s.z+s.depth/2]),l.relay[2]];
 const minX=Math.min(...xs),maxX=Math.max(...xs),minZ=Math.min(...zs),maxZ=Math.max(...zs),size=Math.max(maxX-minX,maxZ-minZ)+20;
 const view={x:(minX+maxX-size)/2,z:(minZ+maxZ-size)/2,size,unit:size/280,following:false};
 // Switch to a local surface view before the player's arrow leaves the map.
 const margin=view.unit*9;
 if(position[0]<view.x+margin||position[0]>view.x+size-margin||position[2]<view.z+margin||position[2]>view.z+size-margin)return follow();
 return view;
}
export function mapContains(view:TacticalView,x:number,z:number){return x>=view.x&&x<=view.x+view.size&&z>=view.z&&z<=view.z+view.size}
export function mapEdge(view:TacticalView,x:number,z:number){
 const cx=view.x+view.size/2,cz=view.z+view.size/2,dx=x-cx,dz=z-cz,limit=view.size/2-view.unit*14,ratio=limit/Math.max(Math.abs(dx),Math.abs(dz),limit);
 return {x:cx+dx*ratio,z:cz+dz*ratio,heading:Math.atan2(dx,-dz)*180/Math.PI};
}
