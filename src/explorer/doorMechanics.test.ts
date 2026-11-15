import { describe,it,expect } from 'vitest';
import { DOOR_HEIGHT,DOOR_SLATS,DOOR_SLAT_HEIGHT,doorSlatPose,doorPassable } from './doorMechanics';

describe('ceiling-retracting doors',()=>{
 it('seals the whole doorway when closed and stows every leaf above the walking space when open',()=>{
  const closed=Array.from({length:DOOR_SLATS},(_,i)=>doorSlatPose(i,0));
  expect(closed[0].y-DOOR_SLAT_HEIGHT/2).toBeCloseTo(0);
  expect(closed.at(-1)!.y+DOOR_SLAT_HEIGHT/2).toBeCloseTo(DOOR_HEIGHT);
  for(let i=0;i<DOOR_SLATS;i++)expect(doorSlatPose(i,1).y-DOOR_SLAT_HEIGHT/2).toBeGreaterThan(2.7);
 });
 it('keeps the interlock closed until every visible leaf clears a standing astronaut',()=>{
  expect(doorPassable(0)).toBe(false);expect(doorPassable(.9)).toBe(false);expect(doorPassable(1)).toBe(true);
  for(let p=0;p<=1;p+=.001)if(doorPassable(p))for(let i=0;i<DOOR_SLATS;i++)expect(doorSlatPose(i,p).y-DOOR_SLAT_HEIGHT/2).toBeGreaterThan(2.6);
 });
});
