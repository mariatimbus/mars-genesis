import { beforeAll, describe, expect, it } from 'vitest';
import RAPIER from '@react-three/rapier/node_modules/@dimforge/rapier3d-compat';
import { Quaternion, Euler } from 'three';
import { initialBuildings } from '../simulation/engine';
import { CELL, FLOOR, cellKey, makeLayout, doorIsOpen } from './layout';
import { circulation, makeFixtures, crewFixture, overlaps, solarPlacements, exteriorClear, terrainHeight } from './fixtures';
import { createWalker } from './movement';

const layout=makeLayout(initialBuildings),fixtures=makeFixtures(layout);
beforeAll(async()=>{await RAPIER.init()});
describe('unobstructed base circulation',()=>{
 it('keeps furnishings and crew out of every reserved route, with usable facilities',()=>{
  for(const r of layout.rooms){expect(fixtures.filter(f=>f.roomId===r.id&&f.type==='terminal'),`${r.id}: terminal`).toHaveLength(1);
   if(r.kind==='habitat')expect(fixtures.filter(f=>f.roomId===r.id&&f.type==='suit'),`${r.id}: suit locker`).toHaveLength(1);
   expect(fixtures.filter(f=>f.roomId===r.id&&f.type!=='terminal').length,`${r.id}: equipment`).toBeGreaterThan(0);
  }
  const occupied=[...fixtures];
  for(let i=0;i<4;i++){const f=crewFixture(layout,layout.habitat,occupied,`crew-${i}`);expect(f,`crew-${i} has a clear bay`).toBeDefined()}
  for(const f of occupied){expect(circulation(layout).some(road=>overlaps(f,road,.1)),f.id).toBe(false)}
  for(let i=0;i<occupied.length;i++)for(let j=0;j<i;j++)expect(overlaps(occupied[i],occupied[j],.1),`${occupied[i].id} / ${occupied[j].id}`).toBe(false);
 });
 it('can reach an interaction position in front of every terminal and suit locker',()=>{
  const step=.5,start=[layout.spawn[0]/step,layout.spawn[2]/step],key=(x:number,z:number)=>`${x},${z}`;
  const free=(x:number,z:number)=>{
   for(const dx of [-.38,.38])for(const dz of [-.38,.38])if(!layout.cells.has(cellKey(Math.round((x+dx)/CELL),Math.round((z+dz)/CELL))))return false;
   return !fixtures.some(f=>overlaps(f,{x,z,width:.76,depth:.76}));
  };
  const seen=new Set([key(...start as [number,number])]),queue=[start];
  for(let i=0;i<queue.length;i++){const [x,z]=queue[i];for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const nx=x+dx,nz=z+dz,k=key(nx,nz);if(!seen.has(k)&&free(nx*step,nz*step)){seen.add(k);queue.push([nx,nz])}
  }}
  for(const f of fixtures.filter(f=>f.access)){
   const a=f.access!;
   expect(queue.some(([x,z])=>Math.hypot(x*step-a.x,z*step-a.z)<.55),`${f.id} interaction approach`).toBe(true);
  }
 });
 it('relocates every solar array outside buildings and the airlock exit apron',()=>{
  const arrays=solarPlacements(layout,initialBuildings);expect(arrays).toHaveLength(initialBuildings.filter(b=>b.kind==='solar').length);
  for(const a of arrays)expect(exteriorClear(layout,a),a.building.id).toBe(true);
  for(let i=0;i<arrays.length;i++)for(let j=0;j<i;j++)expect(overlaps(arrays[i],arrays[j],.9)).toBe(false);
 });
 it('keeps terrain under floors, including an expanded base on steep terrain',()=>{
  const expanded=makeLayout([...initialBuildings,{id:'remote-lab',kind:'research',x:45,z:40,active:true}]);
  for(const key of expanded.cells){const [x,z]=key.split(',').map(Number);for(const dx of [-1.4,0,1.4])for(const dz of [-1.4,0,1.4])expect(terrainHeight(expanded,x*CELL+dx,z*CELL+dz)).toBeLessThan(0)}
  // The rendered terrain has 2.5 m triangles, not an infinitely fine surface.
  for(const key of expanded.cells){const [x,z]=key.split(',').map(Number);for(const dx of [-1.4,1.4])for(const dz of [-1.4,1.4]){
   const vx=Math.floor((x*CELL+dx+225)/2.5)*2.5-225,vz=Math.floor((z*CELL+dz+225)/2.5)*2.5-225;
   for(const mx of [vx,vx+2.5])for(const mz of [vz,vz+2.5])expect(terrainHeight(expanded,mx,mz)).toBeLessThan(FLOOR-.1);
  }}
  expect(terrainHeight(expanded,expanded.relay[0],expanded.relay[2])).toBeLessThan(0);
  expect(terrainHeight(expanded,180,-180)).toBeGreaterThan(1);
 });
 it('starts ordinary doors open and airlock doors sealed',()=>{
  for(const d of layout.doors){expect(doorIsOpen(d,{})).toBe(!d.airlock);expect(doorIsOpen(d,{[d.id]:false})).toBe(false);expect(doorIsOpen(d,{[d.id]:true})).toBe(true)}
 });
 it('walks the real physics capsule from spawn to every room with furniture and walls present',()=>{
  const world=new RAPIER.World({x:0,y:-3.71,z:0}),fixed=world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  world.createCollider(RAPIER.ColliderDesc.cuboid(120,.18,120).setTranslation(0,FLOOR-.18,0),fixed);
  for(const key of layout.cells){const [ix,iz]=key.split(',').map(Number);for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
   if(layout.cells.has(cellKey(ix+dx,iz+dz)))continue;
   const x=(ix+dx*.5)*CELL,z=(iz+dz*.5)*CELL;
   if(Math.abs(x-layout.airlock.x)<.1&&Math.abs(z-layout.airlock.outerZ)<.1)continue;
   world.createCollider(RAPIER.ColliderDesc.cuboid(dx?.11:1.5,1.6,dz?.11:1.5).setTranslation(x,FLOOR+1.6,z),fixed);
  }}
  const occupied=[...fixtures];for(let i=0;i<3;i++)crewFixture(layout,layout.habitat,occupied,`npc-${i}`);
  for(const f of occupied){const q=new Quaternion().setFromEuler(new Euler(0,f.rotation,0));world.createCollider(RAPIER.ColliderDesc.cuboid(f.size[0]/2,f.type==='terminal'?.35:f.size[1]/2,f.size[2]/2).setTranslation(f.x,FLOOR+(f.type==='terminal'?1.45:f.size[1]/2),f.z).setRotation(q),fixed)}
  const body=world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased()),collider=world.createCollider(RAPIER.ColliderDesc.capsule(.55,.35),body),walker=createWalker(world);
  const start=cellKey(layout.habitat.x,layout.habitat.z),parents=new Map<string,string|null>([[start,null]]),queue=[start];
  for(let i=0;i<queue.length;i++){const [x,z]=queue[i].split(',').map(Number);for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const next=cellKey(x+dx,z+dz);if(layout.walkways.has(next)&&!parents.has(next)){parents.set(next,queue[i]);queue.push(next)}}}
  for(const room of [...layout.rooms,{id:'airlock-entry',x:layout.airlock.x/CELL,z:layout.airlock.innerZ/CELL-.5}]){const path:string[]=[];let key:string|null=cellKey(room.x,room.z);expect(parents.has(key),room.id).toBe(true);while(key!==null){path.unshift(key);key=parents.get(key)!}
   const spawn={x:layout.spawn[0],y:layout.spawn[1],z:layout.spawn[2]};body.setTranslation(spawn,true);body.setNextKinematicTranslation(spawn);world.step();
   for(const key of path){const [gx,gz]=key.split(',').map(Number),x=gx*CELL,z=gz*CELL;
    for(let step=0;step<180;step++){const p=body.translation(),distance=Math.hypot(x-p.x,z-p.z);if(distance<.04)break;const speed=Math.min(.075,distance);
     walker.computeColliderMovement(collider,{x:(x-p.x)/distance*speed,y:-.03,z:(z-p.z)/distance*speed});const m=walker.computedMovement();body.setNextKinematicTranslation({x:p.x+m.x,y:p.y+m.y,z:p.z+m.z});world.step();}
    const p=body.translation();expect(Math.hypot(x-p.x,z-p.z),`${room.id} blocked at ${key}`).toBeLessThan(.08);
   }
  }
  world.removeCharacterController(walker);world.free();
 },15000);
});
