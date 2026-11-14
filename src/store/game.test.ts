import { beforeEach,describe,it,expect,vi } from 'vitest';
import { commissionAll } from '../simulation/testHelpers';
import { facilityUnlocked } from '../simulation/commissioning';
import { initialBuildings } from '../simulation/engine';
const memory=new Map<string,string>();
vi.stubGlobal('localStorage',{getItem:(k:string)=>memory.get(k)??null,setItem:(k:string,v:string)=>memory.set(k,v),removeItem:(k:string)=>memory.delete(k)});
vi.stubGlobal('window',{localStorage:globalThis.localStorage});
const {useGame,simulationSnapshot}=await import('./game');
beforeEach(()=>{useGame.getState().reset(2026,'commander','solar-watch');useGame.setState(commissionAll(simulationSnapshot(useGame.getState())))});
describe('player actions and saves',()=>{
 it('rejects overlaps without spending resources',()=>{useGame.getState().build('solar');expect(useGame.getState().place(0,0)).toBe(false);expect(useGame.getState().resources.materials).toBe(160)});
 it('constructs a facility and charges the published cost',()=>{useGame.getState().build('solar');expect(useGame.getState().place(20,-18)).toBe(true);expect(useGame.getState().buildings).toHaveLength(initialBuildings.length+1);expect(useGame.getState().resources.materials).toBe(125)});
 it('save/load preserves crew, delayed effects, decisions and deterministic replay',async()=>{useGame.getState().next();useGame.getState().next();useGame.getState().next();expect(useGame.getState().pendingEvent?.kind).toBe('solar');useGame.getState().decide('essential');const original=structuredClone({queue:useGame.getState().queue,astronauts:useGame.getState().astronauts,stats:useGame.getState().stats});const saved=memory.get('mars-genesis-survival')!;useGame.getState().reset();memory.set('mars-genesis-survival',saved);await useGame.persist.rehydrate();expect(useGame.getState().queue).toEqual(original.queue);expect(useGame.getState().astronauts).toEqual(original.astronauts);expect(useGame.getState().stats).toEqual(original.stats)});
 it('incapacitated crew cannot be assigned external duties',()=>{useGame.setState(s=>({astronauts:s.astronauts.map(c=>c.role==='Engineer'?{...c,health:20,condition:'Incapacitated',assignment:'rest',canWork:false}:c)}));useGame.getState().assign('crew-1','maintenance');expect(useGame.getState().astronauts[1].assignment).toBe('rest')});

 it('requires selection and confirmation before opening only one small parcel',()=>{
  useGame.getState().build('solar');expect(useGame.getState().place(30,5)).toBe(false);
  useGame.getState().startExpansion();useGame.getState().chooseExpansion('east-1-2');expect(useGame.getState().selectedPlot).toBeNull();
  useGame.getState().chooseExpansion('east-0-2');expect(useGame.getState().expandedPlots).toEqual([]);
  useGame.getState().confirmExpansion();expect(useGame.getState().expandedPlots).toEqual(['east-0-2']);
  useGame.getState().build('solar');expect(useGame.getState().place(30,5)).toBe(true);
  expect(useGame.getState().resources.materials).toBe(125);
  useGame.getState().build('solar');expect(useGame.getState().place(-30,5)).toBe(false);
  expect(useGame.getState().place(30,5)).toBe(false);
 });
 it('cancelling does not modify terrain and confirmed parcels survive save/load',async()=>{
  useGame.getState().startExpansion();useGame.getState().chooseExpansion('east-0-2');useGame.getState().build(null);
  expect(useGame.getState().expandedPlots).toEqual([]);expect(useGame.getState().expanding).toBe(false);
  useGame.getState().startExpansion();useGame.getState().chooseExpansion('east-0-2');useGame.getState().confirmExpansion();
  const saved=memory.get('mars-genesis-survival')!;useGame.getState().reset();memory.set('mars-genesis-survival',saved);
  await useGame.persist.rehydrate();expect(useGame.getState().expandedPlots).toEqual(['east-0-2']);
 });
 it('migrates older saves without losing crew, buildings or unlocking extra terrain',async()=>{
  const state=JSON.parse(memory.get('mars-genesis-survival')!).state;
  delete state.expandedPlots;state.sol=7;state.buildings.push({id:'legacy-outpost',kind:'solar',x:42,z:35,active:true});
  memory.set('mars-genesis-survival',JSON.stringify({version:2,state}));
  await useGame.persist.rehydrate();expect(useGame.getState().sol).toBe(7);expect(useGame.getState().astronauts).toHaveLength(4);
  expect(useGame.getState().buildings.at(-1)?.id).toBe('legacy-outpost');expect(useGame.getState().expandedPlots).toEqual([]);
 });

 it('opens the prologue for a new mission and completing it does not spend resources or advance time',()=>{
  const before={sol:useGame.getState().sol,resources:useGame.getState().resources,astronauts:useGame.getState().astronauts};
  expect(useGame.getState().prologueSeen).toBe(false);useGame.getState().completePrologue();
  expect(useGame.getState().prologueSeen).toBe(true);expect(useGame.getState().sol).toBe(before.sol);
  expect(useGame.getState().resources).toEqual(before.resources);expect(useGame.getState().astronauts).toEqual(before.astronauts);
 });
 it('remembers the completed prologue across save and reload',async()=>{
  useGame.getState().completePrologue();const saved=memory.get('mars-genesis-survival')!;
  useGame.setState({prologueSeen:false});memory.set('mars-genesis-survival',saved);
  await useGame.persist.rehydrate();expect(useGame.getState().prologueSeen).toBe(true);
 });
 it('replaying the story preserves an ongoing mission and its queued consequences',()=>{
  useGame.getState().completePrologue();useGame.getState().next();useGame.getState().next();useGame.getState().next();useGame.getState().decide('essential');
  const before=structuredClone({sol:useGame.getState().sol,resources:useGame.getState().resources,queue:useGame.getState().queue,astronauts:useGame.getState().astronauts});
  useGame.getState().replayPrologue();expect(useGame.getState().prologueSeen).toBe(false);useGame.getState().completePrologue();
  expect({sol:useGame.getState().sol,resources:useGame.getState().resources,queue:useGame.getState().queue,astronauts:useGame.getState().astronauts}).toEqual(before);
 });
 it('shows the prologue again on mission restart',()=>{
  useGame.getState().completePrologue();useGame.getState().reset();expect(useGame.getState().prologueSeen).toBe(false);
 });

 it('upgrades a saved mission to English and opens the new flight without resetting the colony',async()=>{
  const state=JSON.parse(memory.get('mars-genesis-survival')!).state;
  state.sol=8;state.prologueSeen=true;state.message='Extindere anulată.';state.history=['Parcela selectată este pregătită pentru construcții. Restul terenului a rămas neschimbat.'];
  memory.set('mars-genesis-survival',JSON.stringify({version:3,state}));await useGame.persist.rehydrate();
  expect(useGame.getState().sol).toBe(8);expect(useGame.getState().prologueSeen).toBe(false);expect(useGame.getState().message).toBe('Expansion cancelled.');expect(useGame.getState().history[0]).toContain('selected parcel is ready');expect(useGame.getState().astronauts).toHaveLength(4);
 });

});

describe('startup actions and persistence',()=>{
 beforeEach(()=>useGame.getState().reset(2026,'commander','solar-watch'));
 it('cannot activate, build, expand or advance around an unfinished challenge',()=>{
  const g=useGame.getState(),before=structuredClone({resources:g.resources,buildings:g.buildings});
  g.select(g.buildings.find(b=>b.kind==='solar')!.id);g.toggle();g.build('solar');
  expect(useGame.getState().place(20,-18)).toBe(false);g.startExpansion();g.next();
  expect(useGame.getState().sol).toBe(1);expect(useGame.getState().expanding).toBe(false);
  expect(useGame.getState().buildings).toEqual(before.buildings);expect(useGame.getState().resources).toEqual(before.resources);
 });
 it('preserves completed challenges, unsuccessful attempts and offline facilities after reload',async()=>{
  useGame.getState().completePrologue();useGame.getState().trainingAction('dust',{type:'wipe',index:0});useGame.getState().trainingAction('dust',{type:'wipe',index:0});
  const expected=structuredClone({commissioning:useGame.getState().commissioning,buildings:useGame.getState().buildings});
  const saved=memory.get('mars-genesis-survival')!;useGame.getState().reset();memory.set('mars-genesis-survival',saved);await useGame.persist.rehydrate();
  expect(useGame.getState().prologueSeen).toBe(true);expect({commissioning:useGame.getState().commissioning,buildings:useGame.getState().buildings}).toEqual(expected);
  expect(useGame.getState().sol).toBe(1);useGame.getState().next();expect(useGame.getState().sol).toBe(1);
 });
 it('keeps a partially commissioned version 5 mission and adds the trainer without a reset',async()=>{
  const state=JSON.parse(memory.get('mars-genesis-survival')!).state;
  state.sol=1;state.prologueSeen=true;state.commissioning={completed:['solar','habitat'],attempts:{solar:2},feedback:null};
  state.buildings=state.buildings.map((b:{kind:string;active:boolean})=>({...b,active:b.kind==='solar'||b.kind==='habitat'}));
  const before=structuredClone({resources:state.resources,buildings:state.buildings,astronauts:state.astronauts});
  memory.set('mars-genesis-survival',JSON.stringify({version:5,state}));await useGame.persist.rehydrate();
  expect(useGame.getState().commissioning.completed).toEqual(['solar']);expect(useGame.getState().commissioning.attempts.solar).toBe(2);expect(facilityUnlocked(useGame.getState(),'habitat')).toBe(true);expect(facilityUnlocked(useGame.getState(),'oxygen')).toBe(false);
  expect(useGame.getState().commissioning.training.records).toEqual({});expect(useGame.getState().prologueSeen).toBe(true);
  expect({resources:useGame.getState().resources,buildings:useGame.getState().buildings,astronauts:useGame.getState().astronauts}).toEqual(before);
 });
 it('preserves completed flight state when upgrading a version 4 mission',async()=>{
  const state=JSON.parse(memory.get('mars-genesis-survival')!).state;state.sol=8;state.prologueSeen=true;delete state.commissioning;
  state.buildings=state.buildings.filter((b:{kind:string})=>!['water','medical'].includes(b.kind));
  memory.set('mars-genesis-survival',JSON.stringify({version:4,state}));await useGame.persist.rehydrate();
  expect(useGame.getState().sol).toBe(8);expect(useGame.getState().prologueSeen).toBe(true);expect(useGame.getState().commissioning.completed).toHaveLength(6);
  expect(useGame.getState().buildings.some(b=>b.kind==='medical')).toBe(true);expect(useGame.getState().buildings.some(b=>b.kind==='water')).toBe(true);
 });
});
