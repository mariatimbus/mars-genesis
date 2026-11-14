import { applyTraining, restartTrainingTask, type TaskAction } from '../training/engine';
import type { TaskId } from '../training/catalog';
import { evaTick, startRelayFault, repairEquipment } from '../explorer/survival';
import { commissioningComplete, facilityUnlocked, migrateStartup, migrateTraining } from '../simulation/commissioning';
import { expansionCandidates, EXPANSION_PLOTS } from '../game/worldConfig';
import { englishText } from './english';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { catalog, validPlacement, type Kind } from '../simulation/engine';
import { createScenario, nextSol, canWork } from '../simulation/survival';
import { applyDecision, optionBlocked, decisionOptions } from '../simulation/events';
import type { Assignment, Difficulty, SurvivalState } from '../simulation/types';
type Game = SurvivalState & {
 startFieldMission:()=>void; fieldRepair:(id:string)=>boolean; evaTick:(id:string,dt:number,safe:boolean,suited:boolean,oxygen:number,moving:boolean,sprint:boolean)=>void; fieldUse:(id:string,playerId:string)=>void; refillSuit:(amount:number)=>boolean; pressurize:()=>boolean;
 trainingAction:(id:TaskId,action:TaskAction)=>void; restartTraining:(id:TaskId)=>void;
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
 startFieldMission:()=>set(s=>startRelayFault(simulationSnapshot(s))),
 fieldRepair:id=>{const s=get(),n=repairEquipment(simulationSnapshot(s),id);if(n.resources.materials===s.resources.materials)return false;set(n);return true;},
 evaTick:(id,dt,safe,suited,oxygen,moving,sprint)=>set(s=>{const extra=s.environment.radiationUntil>s.sol?s.environment.radiationExtraMsv:0;const astronauts=s.astronauts.map(c=>c.id===id?evaTick(c,dt,safe,suited,oxygen,moving,sprint,extra):c);return {astronauts,crew:astronauts.filter(c=>c.alive).length};}),
 refillSuit:amount=>{const s=get(),cost=Math.max(0,Math.min(100,amount))*.002;if(s.resources.oxygen<cost)return false;set({resources:{...s.resources,oxygen:s.resources.oxygen-cost},stats:{...s.stats,consumed:{...s.stats.consumed,oxygen:s.stats.consumed.oxygen+cost}}});return true;},
 pressurize:()=>{const s=get();if(s.resources.oxygen<.05||s.resources.power<.2)return false;set({resources:{...s.resources,oxygen:s.resources.oxygen-.05,power:s.resources.power-.2},stats:{...s.stats,consumed:{...s.stats.consumed,oxygen:s.stats.consumed.oxygen+.05,power:s.stats.consumed.power+.2}}});return true;},
 fieldUse:(id,playerId)=>{const s=get(),b=s.buildings.find(b=>b.id===id);if(!b||!b.active||!facilityUnlocked(s,b.kind))return;const flag=`field-use-${id}-${s.sol}`;if(s.flags.includes(flag)){set({message:'Already collected this sol.'});return;}if(s.resources.power<3)return;let n=simulationSnapshot(s);n=structuredClone(n);n.resources.power-=3;n.stats.consumed.power+=3;n.flags.push(flag);if(b.kind==='greenhouse'){n.resources.food+=.35;n.stats.produced.food+=.35;}else if(b.kind==='medical'){n.astronauts=n.astronauts.map(c=>c.id===playerId?{...c,health:Math.min(100,c.health+10),fatigue:Math.max(0,c.fatigue-20)}:c);}else if(b.kind==='storage'){n.resources.materials+=6;n.stats.produced.materials+=6;}else if(b.kind==='research'){n.systems.research+=4;n.resources.materials+=2;n.stats.produced.materials+=2;}else if(b.kind==='water'){n.systems.waterKg=Math.min(150,n.systems.waterKg+1);}else if(b.kind==='oxygen'){n.resources.oxygen+=.2;n.stats.produced.oxygen+=.2;}else if(b.kind==='habitat'){n.astronauts=n.astronauts.map(c=>c.id===playerId?{...c,fatigue:Math.max(0,c.fatigue-15)}:c);}else{n.resources.power=Math.min(n.systems.batteryCapacityKwh,n.resources.power+4);n.stats.produced.power+=4;}n.message='Equipment cycle complete. Colony reserves updated.';set(n);},
 trainingAction:(id,action)=>set(s=>{const before=simulationSnapshot(s),after=applyTraining(before,id,action);return after===before?s:after}),
 restartTraining:id=>set(s=>restartTrainingTask(simulationSnapshot(s),id)),
 completePrologue:()=>set({prologueSeen:true}),
 replayPrologue:()=>set({prologueSeen:false,placing:null,expanding:false,selectedPlot:null}),
 select:id=>set({selected:id,placing:null,expanding:false,selectedPlot:null}),
 build:kind=>{if(kind&&!commissioningComplete(get())){set({message:'Complete all six training rooms before constructing new facilities.'});return;}set({placing:kind,selected:null,expanding:false,selectedPlot:null,message:kind?'Choose clear terrain. Click to construct. Esc to cancel.':'Construction cancelled.'});},
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
}),{name:'mars-genesis-survival',version:6,migrate:(saved,version)=>{const s=saved as Partial<Game>;return {...migrateTraining((version<5?migrateStartup:((state:SurvivalState)=>state))({...s,message:englishText(s.message??'Welcome to Ares One.'),history:(s.history??[]).map(englishText),notifications:(s.notifications??[]).map(englishText),expandedPlots:(s.expandedPlots??[]).filter(id=>EXPANSION_PLOTS.some(p=>p.id===id))} as Game)),prologueSeen:version<4?false:(s.prologueSeen??false)} as Game},partialize:state=>({...simulationSnapshot(state),prologueSeen:state.prologueSeen})}));
export function simulationSnapshot(state:Game):SurvivalState {
 const {selected,placing,expanding,selectedPlot,prologueSeen,...rest}=state;
 return Object.fromEntries(Object.entries(rest).filter(([,v])=>typeof v!=='function')) as unknown as SurvivalState;
}
