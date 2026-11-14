import { describe,it,expect } from 'vitest';
import { initialBuildings } from '../simulation/engine';
import { makeLayout } from './layout';
import { exteriorPlan } from './exteriorPlan';
import { mapContains, mapEdge, tacticalFloor, tacticalView } from './tacticalMap';
const layout=makeLayout(initialBuildings),plan=exteriorPlan(layout,initialBuildings);
describe('tactical map geometry',()=>{
 it('draws only the six exterior edges of two neighbouring floor cells',()=>{
  const floor=tacticalFloor({...layout,cells:new Set(['0,0','1,0'])});
  expect(floor.floor.match(/Z/g)).toHaveLength(2);expect(floor.walls.match(/M/g)).toHaveLength(6);
  expect(floor.walls).not.toContain('M1.5,-1.5v3');
 });
 it('keeps the base scale stable indoors and follows the explorer before the player arrow leaves view',()=>{
  const start=tacticalView(layout,plan.sites,layout.spawn,false),near=tacticalView(layout,plan.sites,[layout.spawn[0]+1,layout.spawn[1],layout.spawn[2]+1],false);
  expect(near).toEqual(start);expect(mapContains(start,layout.spawn[0],layout.spawn[2])).toBe(true);
  for(const x of [100,170,250,10000]){const view=tacticalView(layout,plan.sites,[x,1,0],false);expect(mapContains(view,x,0)).toBe(true);expect(view.following).toBe(true);}
 });
 it('keeps distant exploration local in both map sizes and provides a bounded home direction',()=>{
  for(const expanded of [false,true]){const view=tacticalView(layout,plan.sites,[9000,1,-6000],expanded),edge=mapEdge(view,layout.spawn[0],layout.spawn[2]);expect(view.size).toBe(expanded?700:200);expect(mapContains(view,edge.x,edge.z)).toBe(true);expect(Number.isFinite(edge.heading)).toBe(true);}
 });
});
