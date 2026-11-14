import { validPlacement, type Kind } from './engine';
import type { SurvivalState } from './types';
import { TRAINING_ROOMS, roomNames, roomTasks, type TrainingRoom } from '../training/catalog';
import { freshTraining, type TrainingProgress } from '../training/engine';
export const STARTUP_KINDS=TRAINING_ROOMS;
export type StartupKind=TrainingRoom;
export interface CommissioningState {
 completed:StartupKind[];
 attempts:Partial<Record<StartupKind,number>>;
 feedback:{kind:StartupKind;correct:boolean;text:string}|null;
 legacyHabitat:boolean;
 training:TrainingProgress;
}
export const STARTUP_CHALLENGES=STARTUP_KINDS.map(kind=>({kind,label:roomNames[kind],title:roomTasks(kind)[0].title,outcome:`${roomNames[kind]} facility online.`}));
export const startupKind=(kind:Kind):StartupKind=>kind==='storage'?'water':kind==='habitat'?'oxygen':kind;
export const facilityUnlocked=(s:Pick<SurvivalState,'commissioning'>,kind:Kind)=>(kind==='habitat'&&s.commissioning.legacyHabitat)||s.commissioning.completed.includes(startupKind(kind));
export const commissioningComplete=(s:Pick<SurvivalState,'commissioning'>)=>STARTUP_KINDS.every(k=>s.commissioning.completed.includes(k));
export const freshCommissioning=():CommissioningState=>({completed:[],attempts:{},feedback:null,legacyHabitat:false,training:freshTraining()});
export function migrateTraining(s:SurvivalState):SurvivalState {
 const n=structuredClone(s);
 const legacyHabitat=n.commissioning?.legacyHabitat||(n.commissioning?.completed as string[]|undefined)?.includes('habitat')||false;
 n.commissioning={...freshCommissioning(),...n.commissioning,legacyHabitat,completed:STARTUP_KINDS.filter(k=>n.commissioning?.completed.includes(k)),training:n.commissioning?.training??freshTraining()};
 // Older completed courses remain online; new mini-games are available as practice.
 n.commissioning.training.weatherUnlocked ||= commissioningComplete(n);
 return n;
}
// Legacy missions keep their running systems and progress. New missions always start offline.
export function migrateStartup(s:SurvivalState):SurvivalState {
 const n=structuredClone(s),ongoing=n.sol>1;
 n.commissioning=ongoing?{...freshCommissioning(),completed:[...STARTUP_KINDS]}:freshCommissioning();
 for(const [kind,preferredX,preferredZ] of [['medical',-16,-14],['water',10,-15]] as const){
  if(n.buildings.some(b=>b.kind===kind))continue;
  const locations:[[number,number],...[number,number][]]=[[preferredX,preferredZ]];
  for(let z=-19;z<=19;z+=6)for(let x=-21;x<=21;x+=6)locations.push([x,z]);
  const location=locations.find(([x,z])=>validPlacement(kind,x,z,n.buildings,n.expandedPlots));
  if(location)n.buildings.push({id:`startup-${kind}`,kind,x:location[0],z:location[1],active:ongoing,damage:0});
 }
 if(!ongoing){n.buildings=n.buildings.map(b=>({...b,active:false}));n.message='Six rooms are waiting. Complete 18 hands-on training tasks to wake the colony.';}
 return n;
}
