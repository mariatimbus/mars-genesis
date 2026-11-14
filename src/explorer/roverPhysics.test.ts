import { beforeAll, describe, expect, it } from 'vitest';
import RAPIER from '@react-three/rapier/node_modules/@dimforge/rapier3d-compat';
import { driveStep, exitCandidates, ROVER_CRUISE, ROVER_BOOST } from './roverPhysics';
import { chunkData } from './StreamedTerrain';
import { makeLayout } from './layout';
import { initialBuildings } from '../simulation/engine';
import { meshGroundHeight } from './fixtures';
import { createWalker } from './movement';
beforeAll(async()=>{await RAPIER.init()});
describe('drivable rovers',()=>{
 it('accelerates, boosts, brakes and reverses without consuming battery when paused',()=>{
  let speed=0,heading=0,battery=100;
  const step=(throttle:number,boost=false,brake=false)=>{const n=driveStep(speed,heading,{throttle,steer:0,boost,brake,battery},1/60);speed=n.speed;heading=n.heading;battery=n.battery};
  for(let i=0;i<180;i++)step(1);expect(speed).toBeCloseTo(ROVER_CRUISE);
  for(let i=0;i<180;i++)step(1,true);expect(speed).toBeCloseTo(ROVER_BOOST);expect(battery).toBeLessThan(100);
  for(let i=0;i<120;i++)step(0,false,true);expect(speed).toBe(0);
  for(let i=0;i<120;i++)step(-1);expect(speed).toBeCloseTo(-8);
  expect(driveStep(speed,heading,{throttle:1,steer:1,boost:true,brake:false,battery},0).battery).toBe(battery);
  expect(driveStep(3,0,{throttle:1,steer:1,boost:false,brake:false,battery:100},.1).heading).toBeGreaterThan(0);
  expect(driveStep(-3,0,{throttle:-1,steer:1,boost:false,brake:false,battery:100},.1).heading).toBeLessThan(0);
 });
 it('finds exit positions beside the vehicle, above local terrain',()=>{
  const r={id:'test',name:'Test',position:[100,4,200] as [number,number,number],heading:Math.PI/2,battery:100,speed:0,odometer:0};
  for(const p of exitCandidates(r,()=>10)){expect(Math.hypot(p[0]-100,p[2]-200)).toBeGreaterThan(3);expect(p[1]).toBeCloseTo(10.96)}
 });
 it('drives the chassis across streamed chunk seams hundreds of metres from base and stops against a real obstacle',()=>{
  const l=makeLayout(initialBuildings),world=new RAPIER.World({x:0,y:-3.71,z:0});
  for(let z=3;z<=7;z++)for(let x=2;x<=4;x++){
   const d=chunkData(l,[],x,z,40);world.createCollider(RAPIER.ColliderDesc.trimesh(d.positions,new Uint32Array(d.surfaceIndices)).setTranslation(x*100,0,z*100));
  }
  const start=meshGroundHeight(l,340,410),body=world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(340,start+1.1,410)),collider=world.createCollider(RAPIER.ColliderDesc.cuboid(1.5,.8,1.95).setTranslation(0,-.25,0),body),walker=createWalker(world);walker.enableSnapToGround(.8);world.step();
  const wallY=meshGroundHeight(l,340,620);world.createCollider(RAPIER.ColliderDesc.cuboid(15,15,1).setTranslation(340,wallY+12,620));world.step();
  let vertical=0;
  for(let i=0;i<1000;i++){vertical=walker.computedGrounded()?-.3:Math.max(-20,vertical-3.71/60);walker.computeColliderMovement(collider,{x:0,y:vertical/60,z:18/60});const p=body.translation(),m=walker.computedMovement();body.setNextKinematicTranslation({x:p.x+m.x,y:p.y+m.y,z:p.z+m.z});world.step();}
  const p=body.translation();expect(p.z).toBeGreaterThan(600);expect(p.z).toBeLessThan(618);expect(p.y).toBeGreaterThan(meshGroundHeight(l,p.x,p.z)-.1);
  world.removeCharacterController(walker);world.free();
 },20000);
});
