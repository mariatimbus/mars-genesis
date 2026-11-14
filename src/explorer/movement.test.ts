import { beforeAll, describe, expect, it } from 'vitest';
import RAPIER from '@react-three/rapier/node_modules/@dimforge/rapier3d-compat';
import { Vector3 } from 'three';
import { createWalker, movementInput } from './movement';

beforeAll(async () => { await RAPIER.init(); });
describe('astronaut movement', () => {
  it('supports WASD and arrows, diagonal speed and opposing keys', () => {
    const north = new Vector3(0,0,-1);
    expect(movementInput(new Set(['KeyW']),north).toArray()).toEqual([0,0,-1]);
    expect(movementInput(new Set(['ArrowDown']),north).distanceTo(new Vector3(0,0,1))).toBeCloseTo(0);
    expect(movementInput(new Set(['ArrowRight']),north).toArray()).toEqual([1,0,0]);
    expect(movementInput(new Set(['KeyW','ArrowUp','KeyD']),north).length()).toBeCloseTo(1);
    expect(movementInput(new Set(['KeyW','KeyS']),north).length()).toBe(0);
    expect(movementInput(new Set(['ArrowUp']),new Vector3(1,0,0)).x).toBe(1);
    expect(movementInput(new Set(['KeyW']),new Vector3(0,1,0)).length()).toBeCloseTo(1);
  });
  it('walks forward and backward after a development effect remount and stops at a wall', () => {
    const world = new RAPIER.World({x:0,y:-3.71,z:0});
    const floor = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
    world.createCollider(RAPIER.ColliderDesc.cuboid(10,.18,10).setTranslation(0,.17,0),floor);
    world.createCollider(RAPIER.ColliderDesc.cuboid(10,2,.1).setTranslation(0,2,3),floor);
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0,1.35,0));
    const collider = world.createCollider(RAPIER.ColliderDesc.capsule(.55,.35),body);
    // React StrictMode performs setup, cleanup, setup.
    const first = createWalker(world); world.removeCharacterController(first);
    const controller = createWalker(world); world.step();
    const walk = (z:number,steps:number) => { for(let i=0;i<steps;i++) {
      controller.computeColliderMovement(collider,{x:0,y:-.03,z:z/60});
      const p=body.translation(),m=controller.computedMovement();
      body.setNextKinematicTranslation({x:p.x+m.x,y:p.y+m.y,z:p.z+m.z});world.step();
    }};
    walk(-3,60);expect(body.translation().z).toBeLessThan(-2.8);
    walk(3,60);expect(body.translation().z).toBeCloseTo(0,1);
    walk(3,120);expect(body.translation().z).toBeGreaterThan(2);expect(body.translation().z).toBeLessThan(2.6);
    expect(body.translation().y).toBeGreaterThan(1.2);
    world.removeCharacterController(controller);world.free();
  });
});
