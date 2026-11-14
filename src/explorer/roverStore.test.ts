import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useExplorer } from './store';
import { useGame } from '../store/game';
import { createScenario } from '../simulation/scenario';
import { makeLayout } from './layout';
import { initialBuildings } from '../simulation/engine';
const layout=makeLayout(initialBuildings);
beforeEach(()=>{
 vi.stubGlobal('document',{exitPointerLock:vi.fn()});useGame.setState(createScenario());
 useExplorer.setState({rovers:[],activeRover:null,position:layout.spawn,playerId:'crew-0',suited:false,oxygen:8,evaSeconds:10,locked:false,panel:null,relocation:0});
 useExplorer.getState().initRovers(layout);
});
describe('rover expedition actions',()=>{
 it('spawns two rovers, checks boarding distance and prepares a charged suit for deployment',()=>{
  const e=useExplorer.getState();expect(e.rovers).toHaveLength(2);const r=e.rovers[0];
  expect(e.boardRover(r.id)).toBe(false);expect(useExplorer.getState().activeRover).toBeNull();
  const oxygen=useGame.getState().resources.oxygen;expect(e.boardRover(r.id,true)).toBe(true);
  const deployed=useExplorer.getState();expect(deployed.activeRover).toBe(r.id);expect(deployed.position).toEqual(r.position);expect(deployed.suited).toBe(true);expect(deployed.oxygen).toBe(100);
  expect(useGame.getState().resources.oxygen).toBeCloseTo(oxygen-.184);
 });
 it('protects suit oxygen and EVA time inside the cabin and preserves parked vehicles on return',()=>{
  const e=useExplorer.getState(),r=e.rovers[0];e.boardRover(r.id,true);
  for(let i=0;i<100;i++)useExplorer.getState().tick(.1,true,true);
  expect(useExplorer.getState().oxygen).toBe(100);expect(useExplorer.getState().evaSeconds).toBe(10);
  e.returnToBase(layout);expect(useExplorer.getState().activeRover).toBeNull();expect(useExplorer.getState().position).toEqual(layout.spawn);expect(useExplorer.getState().rovers[0].position).toEqual(r.position);
  useExplorer.getState().tick(.1,true,false);expect(useExplorer.getState().oxygen).toBeLessThan(100);
 });
});
