import { beforeAll, describe, expect, it } from 'vitest';
import RAPIER from '@react-three/rapier/node_modules/@dimforge/rapier3d-compat';
import { initialBuildings } from '../simulation/engine';
import { makeLayout, FLOOR } from './layout';
import { exteriorClear, overlaps } from './fixtures';
import { exteriorPlan, routeSamples, airlockRamp } from './exteriorPlan';
import { createWalker } from './movement';
const layout=makeLayout(initialBuildings);
beforeAll(async()=>{await RAPIER.init()});
describe('exterior exploration',()=>{
 it('places the landing zone and equipment without obstructing buildings or solar fields',()=>{
  const plan=exteriorPlan(layout,initialBuildings);
  expect(plan.sites.map(s=>s.kind).sort()).toEqual(['cargo','comms','landing','weather']);
  for(const site of plan.sites){expect(exteriorClear(layout,site,1),site.id).toBe(true);for(const a of plan.arrays)expect(overlaps(a,site,1)).toBe(false)}
  for(let i=0;i<plan.sites.length;i++)for(let j=0;j<i;j++)expect(overlaps(plan.sites[i],plan.sites[j],1)).toBe(false);
  expect(plan.rocks.length).toBeGreaterThan(100);
  for(const rock of plan.rocks){expect(exteriorClear(layout,rock,.6)).toBe(true);for(const site of plan.sites)expect(overlaps(rock,site,.6)).toBe(false)}
 });
 it('keeps all route approaches clear of solid scenery and the landing route clear of solar arrays',()=>{
  const plan=exteriorPlan(layout,initialBuildings);
  expect(plan.routes.map(r=>r.id)).toEqual(['relay','landing']);
  for(const route of plan.routes)for(const [x,,z] of routeSamples(route,.5)){
   const lane={x,z,width:2.6,depth:2.6};
   for(const rock of plan.rocks)expect(overlaps(rock,lane,.2),`${route.id}: rock`).toBe(false);
   for(const s of plan.sites.filter(s=>s.kind!=='landing'))expect(overlaps(s,lane,.2),`${route.id}: ${s.id}`).toBe(false);
   for(const a of plan.arrays)expect(overlaps(a,lane,.2),`${route.id}: solar`).toBe(false);
  }
 });
 it('lets the physics capsule leave and re-enter the airlock over the actual ramp at fast speed',()=>{
  const world=new RAPIER.World({x:0,y:-3.71,z:0}),fixed=world.createRigidBody(RAPIER.RigidBodyDesc.fixed()),z=layout.airlock.outerZ,x=layout.airlock.x;
  world.createCollider(RAPIER.ColliderDesc.cuboid(10,.18,12).setTranslation(x,FLOOR-.18,z-12),fixed);
  world.createCollider(RAPIER.ColliderDesc.cuboid(10,.2,12).setTranslation(x,-.28,z+12),fixed);
  const ramp=airlockRamp(layout);world.createCollider(RAPIER.ColliderDesc.convexHull(ramp.vertices)!,fixed);
  const body=world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(x,FLOOR+.93,z-1)),collider=world.createCollider(RAPIER.ColliderDesc.capsule(.55,.35),body),walker=createWalker(world);world.step();
  const walk=(speed:number,steps:number)=>{for(let i=0;i<steps;i++){walker.computeColliderMovement(collider,{x:0,y:-.03,z:speed/60});const m=walker.computedMovement(),p=body.translation();body.setNextKinematicTranslation({x:p.x+m.x,y:p.y+m.y,z:p.z+m.z});world.step()}};
  walk(9,40);expect(body.translation().z).toBeGreaterThan(z+4.5);expect(body.translation().y).toBeLessThan(1.1);
  walk(-9,40);expect(body.translation().z).toBeLessThan(z-.7);expect(body.translation().y).toBeGreaterThan(FLOOR+.88);
  world.removeCharacterController(walker);world.free();
 });
});
