import { answerStartup, commissioningComplete, facilityUnlocked, migrateStartup, type StartupKind } from '../simulation/commissioning';
import { expansionCandidates, EXPANSION_PLOTS } from '../game/worldConfig';
import { englishText } from './english';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { catalog, validPlacement, type Kind } from '../simulation/engine';
import { createScenario, nextSol, canWork } from '../simulation/survival';
import { applyDecision, optionBlocked, decisionOptions } from '../simulation/events';
import type { Assignment, Difficulty, SurvivalState } from '../simulation/types';
type Game = SurvivalState & {
 answerStartup:(kind:StartupKind,answerId:string)=>void;
 prologueSeen:boolean; completePrologue:()=>void; replayPrologue:()=>void;
 selected:string|null; placing:Kind|null; expanding:boolean; selectedPlot:string|null;
 startExpansion:()=>void; chooseExpansion:(id:string)=>void; confirmExpansion:()=>void;
 select:(id:string|null)=>void;build:(kind:Kind|null)=>void;place:(x:number,z:number)=>boolean;
 next:()=>void;decide:(id:string)=>void;toggle:()=>void;assign:(id:string,assignment:Assignment)=>void;
 priority:(p:'oxygen'|'food')=>void; reset:(seed?:number,difficulty?:Difficulty,scenario?:SurvivalState['scenario'])=>void;
 dismissNotification:()=>void;
};
// The legacy colony save is left untouched. Survival saves include a versioned, complete simulation.
export const useGame=create<Game>()(persist((set,get)=>({...createScenario(),prologueSeen:false,selected:null,placing:null,expanding:false,selectedPlot:null,
 answerStartup:(kind,answerId)=>set(s=>answerStartup(simulationSnapshot(s),kind,answerId)),
 completePrologue:()=>set({prologueSeen:true}),
 replayPrologue:()=>set({prologueSeen:false,placing:null,expanding:false,selectedPlot:null}),
 select:id=>set({selected:id,placing:null,expanding:false,selectedPlot:null}),
 build:kind=>{if(kind&&!commissioningComplete(get())){set({message:'Complete all seven startup challenges before constructing new facilities.'});return;}set({placing:kind,selected:null,expanding:false,selectedPlot:null,message:kind?'Choose clear terrain. Click to construct. Esc to cancel.':'Construction cancelled.'});},
 place:(x,z)=>{
  const s=get(),k=s.placing;
  if(!k||!commissioningComplete(s)||!facilityUnlocked(s,k)||s.pendingEvent||s.status!=='playing'||s.effects.some(e=>e.constructionHold&&e.untilSol>s.sol)||!validPlacement(k,x,z,s.buildings,s.expandedPlots)||s.resources.materials<catalog[k].cost)return false;
  set({buildings:[...s.buildings,{id:`built-${s.seed}-${s.stats.constructed}`,kind:k,x,z,active:true,damage:0}],resources:{...s.resources,materials:s.resources.materials-catalog[k].cost},stats:{...s.stats,constructed:s.stats.constructed+1,consumed:{...s.stats.consumed,materials:s.stats.consumed.materials+catalog[k].cost}},placing:null,message:`${catalog[k].name} constructed. Systems online.`});return true;
 },
 startExpansion:()=>set(s=>!commissioningComplete(s)?{message:'Complete the colony startup before expanding terrain.'}:({expanding:!s.expanding,selectedPlot:null,placing:null,selected:null,message:!s.expanding?'Select a small edge parcel. Only the parcel you confirm will be expanded.':'Expansion cancelled.'})),
 chooseExpansion:id=>{const s=get();if(s.expanding&&expansionCandidates(s.expandedPlots).some(p=>p.id===id))set({selectedPlot:id});},
 confirmExpansion:()=>{const s=get();if(!commissioningComplete(s)||!s.expanding||!s.selectedPlot||s.status!=='playing'||s.pendingEvent||s.effects.some(e=>e.constructionHold&&e.untilSol>s.sol)||!expansionCandidates(s.expandedPlots).some(p=>p.id===s.selectedPlot))return;set({expandedPlots:[...s.expandedPlots,s.selectedPlot],expanding:false,selectedPlot:null,message:'The selected parcel is ready for construction. The rest of the terrain is unchanged.',history:[...s.history,`Sol ${s.sol}: expanded one parcel (${s.selectedPlot}).`]});},
 next:()=>set(s=>nextSol(simulationSnapshot(s))),
 decide:id=>{const s=get();const option=decisionOptions(s).find(o=>o.id===id);if(!option)return;const blocked=optionBlocked(s,option);if(blocked){set({message:blocked});return;}set(applyDecision(simulationSnapshot(s),id));},
 toggle:()=>set(s=>({buildings:s.buildings.map(b=>b.id===s.selected&&facilityUnlocked(s,b.kind)?{...b,active:!b.active}:b)})),
 assign:(id,assignment)=>set(s=>({astronauts:s.astronauts.map(c=>{if(c.id!==id||!c.alive||s.effects.some(e=>e.shelter&&e.untilSol>s.sol))return c;if(c.condition==='Incapacitated'&&assignment!=='rest')return c;const n={...c,assignment};return {...n,canWork:canWork(n)};}),message:'Crew assignment updated.'})),
 priority:p=>set(s=>({flags:[...s.flags.filter(f=>!f.startsWith('priority-')),`priority-${p}`],message:`Power allocation: habitat safety first, then ${p}.`})),
 reset:(seed,difficulty,scenario)=>set(s=>({...createScenario(seed??s.seed,difficulty??s.difficulty,scenario??s.scenario),prologueSeen:false,selected:null,placing:null,expanding:false,selectedPlot:null})),
 dismissNotification:()=>set({notifications:[]})
}),{name:'mars-genesis-survival',version:5,migrate:(saved,version)=>{const s=saved as Partial<Game>;return {...migrateStartup({...s,message:englishText(s.message??'Welcome to Ares One.'),history:(s.history??[]).map(englishText),notifications:(s.notifications??[]).map(englishText),expandedPlots:(s.expandedPlots??[]).filter(id=>EXPANSION_PLOTS.some(p=>p.id===id))} as Game),prologueSeen:version<4?false:(s.prologueSeen??false)} as Game},partialize:state=>({...simulationSnapshot(state),prologueSeen:state.prologueSeen})}));
export function simulationSnapshot(state:Game):SurvivalState {
 const {selected,placing,expanding,selectedPlot,prologueSeen,...rest}=state;
 return Object.fromEntries(Object.entries(rest).filter(([,v])=>typeof v!=='function')) as unknown as SurvivalState;
}
