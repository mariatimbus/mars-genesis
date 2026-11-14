import { describe, expect, it } from 'vitest';
import { PLANET_CIRCUMFERENCE as C, canonicalPosition, planetDirection, surfaceDistance, surfaceBearing, visibleTiles, registerGround, groundReady } from './planet';
import { marsSurfaceHeight } from './terrain';
import { chunkData } from './StreamedTerrain';
import { makeLayout } from './layout';
import { initialBuildings } from '../simulation/engine';

describe('streamed procedural planet',()=>{
 it('joins longitudes and reflects journeys through the poles',()=>{
  expect(canonicalPosition(C/2+1,100).x).toBeCloseTo(-C/2+1);
  const north=canonicalPosition(100,-C/4-10);expect(north.z).toBeCloseTo(-C/4+10);expect(north.poleFlipped).toBe(true);
  expect(surfaceDistance({x:30,z:50},{x:C+30,z:50})).toBeLessThan(.001);
  expect(planetDirection(0,0)).toEqual([0,-0,1]);
  for(const [x,z] of [[300,500],[6500,-2300],[-15000,6000]])expect(marsSurfaceHeight(x+C,z)).toBeCloseTo(marsSurfaceHeight(x,z),5);
  expect(marsSurfaceHeight(0,-C/4)).toBeCloseTo(marsSurfaceHeight(10000,-C/4),5);
 });
 it('gives north/east navigation bearings for selected destinations',()=>{expect(surfaceBearing({x:0,z:0},{x:0,z:-100})).toBeCloseTo(0);expect(surfaceBearing({x:0,z:0},{x:100,z:0})).toBeCloseTo(Math.PI/2)});
 it('keeps the active terrain budget bounded thousands of metres from the base',()=>{
  for(const [x,z] of [[0,0],[6000,-2900],[-15995,7990]]){
   const tiles=visibleTiles(x,z);expect(tiles).toHaveLength(49);expect(tiles.filter(t=>t.physics)).toHaveLength(9);
   const world={},remove=registerGround(world,`${Math.floor(x/100)},${Math.floor(z/100)}`);expect(groundReady(world,x,z)).toBe(true);remove();expect(groundReady(world,x,z)).toBe(false);
  }
 });
 it('generates matching collidable chunk edges and real ground well past the old map',()=>{
  const l=makeLayout(initialBuildings),a=chunkData(l,[],60,-30,40),b=chunkData(l,[],61,-30,40);
  for(let row=0;row<=40;row++)expect(a.positions[(row*41+40)*3+1]).toBeCloseTo(b.positions[row*41*3+1],5);
  expect([...a.positions].every(Number.isFinite)).toBe(true);expect(a.surfaceIndices.length).toBe(40*40*6);
 });
});
