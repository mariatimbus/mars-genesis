import { modeledDustTransmission, modeledSolarExtraMsv } from '../nasa/environment';
import definitions from '../data/historicalEvents.json';
import { canWork, randomStep } from './scenario';
import type { Consequence, DelayedEffect, EventKind, MissionEvent, SurvivalState } from './types';
export const eventDefinition=(kind:EventKind)=>definitions.find(d=>d.kind===kind)!;
export interface DecisionOption { id:string; title:string; cost:string; detail:string; unavailable?:string }
const engReady=(s:SurvivalState)=>s.astronauts.some(c=>c.role==='Engineer'&&c.alive&&c.health>=35&&c.fatigue<85);
export function decisionOptions(s:SurvivalState):DecisionOption[]{
 const engineer=s.astronauts.find(c=>c.role==='Engineer');
 const engineerReady=engineer&&canWork(engineer)&&engineer.assignment==='maintenance';
 const needEngineer=engineerReady?undefined:'Assign a working engineer to maintenance first.';
 switch(s.pendingEvent?.kind){
 case 'solar':return [
 {id:'shelter',title:'Shelter the whole crew',cost:'8 kWh + 5 materials · 2 sols',detail:'Activate reinforced habitat shelter. Production runs at 40%; research pauses.'},
 {id:'essential',title:'Keep essential systems staffed',cost:'4 kWh · 2 sols',detail:'Full food and oxygen output. The engineer remains on duty with more modeled exposure and fatigue.',unavailable:!engReady(s)?'A working engineer is needed for essential duty.':undefined},
 {id:'indoors',title:'Delay outside work',cost:'Up to 6 kWh · 2 sols',detail:'Redirect shielding power. Research and construction pause; reduced exposure, normal food output.'}];
 case 'dust':return [
 {id:'lifesupport',title:'Shut down research',cost:'3 sols without research',detail:'Keep oxygen first, then food. Greenhouses run at 60% to preserve the battery.'},
 {id:'battery',title:'Keep the greenhouse running',cost:'12 kWh reserve deployment · 3 sols',detail:'Prioritize food over oxygen, keep full crop output. The battery may run low.'},
 {id:'clean',title:'Inspect panels after the front passes',cost:'8 materials + 6 kWh · engineer time',detail:'No risky storm EVA: work is scheduled after 3 sols. Boost later solar yield; engineer rests afterward.',unavailable:needEngineer}];
 case 'oxygen':return [
 {id:'repair',title:'Repair the oxygen unit now',cost:'12 materials + 6 kWh · 1–2 sols',detail:'The engineer works on repairs. Other duties pause; fatigue increases.',unavailable:needEngineer},
 {id:'reserve',title:'Release emergency oxygen',cost:'10 materials · 4-sol automated repair',detail:'Add 4 kg of emergency oxygen. A slower automated repair leaves production reduced longer.'},
 {id:'reduce',title:'Reduce activity and oxygen demand',cost:'3 sols at 90% oxygen demand',detail:'Reduce exertion, not breathing. All production is 60%; automated repair takes 3 sols.'}];
 case 'greenhouse':return [
 {id:'repair',title:'Repair the climate controller',cost:'18 materials + 8 kWh · 1–2 sols',detail:'Restore the greenhouse with engineering time and parts.',unavailable:needEngineer},
 {id:'ration',title:'Ration stored food',cost:'70% meals for 3 sols',detail:'Stretch food stocks while automatic recovery takes 4 sols. Fatigue and later health costs are possible.'},
 {id:'backup',title:'Activate backup food production',cost:'45 materials + 6 kWh',detail:'Restart the failed greenhouse using a reserve climate unit at 65% yield. A full repair still takes 4 sols.'}];
 case 'leak':return [
 {id:'isolate',title:'Isolate the damaged habitat',cost:'Up to 6 materials · 3 sols of crowding',detail:'Stop the leak. Use remaining safe habitat space. Production drops to 80%; repair in 4 sols.'},
 {id:'repair',title:'Send an equipped engineer',cost:'14 materials + 6 kWh · 1–2 sols',detail:'Reduce the leak while repairs proceed. Cabin pressure must be watched.',unavailable:needEngineer},
 {id:'relocate',title:'Relocate to another habitat',cost:'10 kWh · research pauses for 2 sols',detail:'Seal off the leaking room and move to safe space. Requires another operational habitat.',unavailable:s.buildings.filter(b=>b.kind==='habitat'&&b.active&&(b.damage??0)<80).length<1?'No spare safe habitat.':undefined}];
 case 'communication':return [
 {id:'wait',title:'Wait for mission control',cost:`${s.environment.commDelayMinutes*2+60} min reduced operations`,detail:'Wait for the round-trip signal and planning. Research time is lost, but a parts-saving procedure arrives next sol.'},
 {id:'autonomous',title:'Let the crew decide',cost:'12 materials + 5 kWh',detail:'Use extra parts to proceed now. Commander takes on extra fatigue; avoid the operations delay.'},
 {id:'procedure',title:'Use the contingency procedure',cost:'6 materials · 2 sols reduced research',detail:'Follow a practiced checklist. Slightly slower work builds preparation for the next fault.'}];
 default:return [];
 }
}
export function eventDue(s:SurvivalState):MissionEvent|null {
 const order:EventKind[]=s.scenario==='solar-watch'?['solar','dust','oxygen','greenhouse','leak','communication','dust']:['dust','solar','greenhouse','oxygen','communication','leak','solar'];
 const base=[3,6,10,14,18,22,26];
 for(let i=0;i<order.length;i++){
  const id=`event-${i}`;const offset=s.difficulty==='cadet'?1:s.difficulty==='expert'?-1:0;
  if(s.sol>=base[i]+offset&&!s.completedEvents.includes(id))return {id,kind:order[i],sol:s.sol,severity:1,sourceId:order[i]==='solar'?(s.seed%2?'solar-2024b':'solar-2024'):eventDefinition(order[i]).sourceId};
 }
 return null;
}
export function beginEvent(s:SurvivalState,event:MissionEvent):SurvivalState {
 const n=structuredClone(s),r=randomStep(n.rng);n.rng=r.seed;
 event.severity=1+r.value*.4+(n.flags.includes('prepared')?-.15:0)+(n.stats.shortages>2?.15:0);
 const targetKind=event.kind==='oxygen'?'oxygen':event.kind==='greenhouse'?'greenhouse':event.kind==='leak'?'habitat':null;
 if(targetKind){const candidates=n.buildings.filter(b=>b.kind===targetKind&&b.active&&(b.damage??0)<80);const b=candidates[Math.floor(r.value*candidates.length)];if(b){event.buildingId=b.id;b.damage=100;n.stats.failures++;}}
 if(event.kind==='leak'&&event.buildingId)n.systems.leakRateKpa=16;
 if(event.kind==='solar'){n.environment.radiationUntil=n.sol+2;n.environment.radiationExtraMsv=modeledSolarExtraMsv(event.severity);}
 if(event.kind==='dust'){n.environment.dustUntil=n.sol+3;n.environment.dustFactor=modeledDustTransmission(undefined,event.severity);}
 n.pendingEvent=event;n.message=`Mission alert: ${eventDefinition(event.kind).title}`;return n;
}
export function applyDecision(s:SurvivalState,choiceId:string):SurvivalState {
 const e=s.pendingEvent;if(!e||s.status!=='playing')return s;
 const option=decisionOptions(s).find(o=>o.id===choiceId);if(!option||option.unavailable)return s;
 const n=structuredClone(s),eng=n.astronauts.find(c=>c.role==='Engineer')!;
 const cost=(materials:number,power=0)=>{if(n.resources.materials<materials||n.resources.power<power)return false;n.resources.materials-=materials;n.resources.power-=power;n.stats.consumed.materials+=materials;n.stats.consumed.power+=power;return true};
 const effect=(values:Omit<Consequence,'id'>)=>n.effects.push({id:`${e.id}-${n.effects.length}`, ...values});
 const queue=(values:Omit<DelayedEffect,'id'>)=>n.queue.push({id:`${e.id}-${n.queue.length}`,...values});
 const repair=(days:number)=>{if(!e.buildingId)return;const b=n.buildings.find(b=>b.id===e.buildingId)!;b.repairUntil=n.sol+days;queue({dueSol:n.sol+days,type:'repair',buildingId:e.buildingId,requiresEngineer:choiceId==='repair',text:`${b.kind} repairs completed.`})};
 const engWork=()=>{eng.fatigue=Math.min(100,eng.fatigue+14);eng.note='Assigned to repairs; fatigue will persist until rest.';};
 const repairDays=(n.difficulty==='cadet'?1:2)+(eng.fatigue>=60?1:0);
 const kind=e.kind;
 if(kind==='solar'){
  if(choiceId==='shelter'){if(!cost(5,8))return s;for(const c of n.astronauts.filter(c=>c.alive)){queue({dueSol:n.sol+2,type:'crew',crewId:c.id,assignment:c.assignment,text:`${c.name} can return from shelter to their previous assignment.`});c.assignment='shelter';c.canWork=false;}effect({label:'Crew shelter protocol',untilSol:n.sol+2,shelter:true,researchOff:true});}
  if(choiceId==='essential'){if(!cost(0,4))return s;if(eng.alive&&eng.health>=35&&eng.fatigue<85){eng.assignment='maintenance';eng.canWork=true;eng.fatigue=Math.min(100,eng.fatigue+28);}effect({label:'Essential crew on duty',untilSol:n.sol+2,exposureFactor:.85});queue({dueSol:n.sol+2,type:'crew',crewId:eng.id,fatigue:22,text:'The extended essential shift left Alex tired. Schedule rest.'});}
  if(choiceId==='indoors'){cost(0,Math.min(6,n.resources.power));effect({label:'Indoor work and power redirection',untilSol:n.sol+2,researchOff:true,constructionHold:true,exposureFactor:.3});}
 }else if(kind==='dust'){
  if(choiceId==='lifesupport')effect({label:'Life support first',untilSol:n.sol+3,researchOff:true,kind:'greenhouse',productionFactor:.6});
  if(choiceId==='battery'){if(!cost(0,12))return s;n.flags=n.flags.filter(f=>f!=='priority-oxygen');n.flags.push('priority-food');effect({label:'Food-priority battery draw',untilSol:n.sol+3});queue({dueSol:n.sol+3,type:'flag',flag:'priority-oxygen',text:'Dust protocol ended. Oxygen priority restored.'});}
  if(choiceId==='clean'){if(!cost(8,6))return s;effect({label:'Engineer planning safe inspection',untilSol:n.sol+3,researchOff:true});queue({dueSol:n.sol+3,type:'flag',flag:'clean-panels',text:'After visibility improved, Alex cleaned and inspected the arrays. Solar yield improved 15%.'});queue({dueSol:n.sol+3,type:'crew',crewId:eng.id,fatigue:22,health:-4,text:'Panel maintenance was tiring. Alex needs recovery time.'});}
 }else if(kind==='oxygen'){
  if(choiceId==='repair'){if(!cost(12,6))return s;engWork();repair(repairDays);}
  if(choiceId==='reserve'){if(!cost(10))return s;n.systems.backupOxygenKg+=4;repair(4);}
  if(choiceId==='reduce'){effect({label:'Low-exertion oxygen conservation',untilSol:n.sol+3,oxygenDemandFactor:.9,productionFactor:.6});repair(3);}
 }else if(kind==='greenhouse'){
  if(choiceId==='repair'){if(!cost(18,8))return s;engWork();repair(repairDays);}
  if(choiceId==='ration'){effect({label:'Reduced food rations',untilSol:n.sol+3,rationFactor:.7});repair(4);queue({dueSol:n.sol+2,type:'flag',flag:'ration-review',text:'Two sols of rationing: check hunger and fatigue in the Crew panel.'});}
  if(choiceId==='backup'){if(!cost(45,6))return s;const b=n.buildings.find(b=>b.id===e.buildingId);if(b)b.damage=35;repair(4);}
 }else if(kind==='leak'){
  if(choiceId==='isolate'){cost(Math.min(6,n.resources.materials));for(const c of n.astronauts.filter(c=>c.alive))c.fatigue=Math.min(100,c.fatigue+8);n.systems.leakRateKpa=0;n.systems.habitatPressureKpa=96;effect({label:'Crowded safe living section',untilSol:n.sol+3,productionFactor:.8});repair(4);}
  if(choiceId==='repair'){if(!cost(14,6))return s;n.systems.leakRateKpa=6;const b=n.buildings.find(b=>b.id===e.buildingId);if(b)b.damage=50;engWork();repair(repairDays);}
  if(choiceId==='relocate'){if(!cost(0,10))return s;n.systems.leakRateKpa=0;n.systems.habitatPressureKpa=98;effect({label:'Crew relocation',untilSol:n.sol+2,researchOff:true});repair(4);}
 }else {
  if(choiceId==='wait'){const duration=(n.environment.commDelayMinutes*2+60)/(24.6597*60);effect({label:'Waiting for Earth guidance',untilSol:n.sol+1,productionFactor:1-duration});queue({dueSol:n.sol+1,type:'resource',resource:'materials',amount:8,text:'Mission control sent a parts-saving repair procedure: 8 materials recovered.'});}
  if(choiceId==='autonomous'){if(!cost(12,5))return s;n.astronauts.find(c=>c.role==='Commander')!.fatigue+=18;queue({dueSol:n.sol+2,type:'crew',crewId:'crew-0',fatigue:8,text:'Autonomous coordination took extra effort. Maya could use a rest.'});}
  if(choiceId==='procedure'){if(!cost(6))return s;effect({label:'Contingency checklist',untilSol:n.sol+2,kind:'research',productionFactor:.5});queue({dueSol:n.sol+2,type:'flag',flag:'prepared',text:'The practiced checklist improved preparedness for later events.'});}
 }
 n.completedEvents.push(e.id);n.flags.push(`${kind}:${choiceId}`);n.stats.decisions.push({sol:n.sol,event:eventDefinition(kind).title,choice:option.title,explanation:eventDefinition(kind).concept,outcome:`${option.title}. ${option.detail} Known cost: ${option.cost}`,sourceId:e.sourceId});
 n.history.push(`Sol ${n.sol}: ${eventDefinition(kind).title} → ${option.title}. ${option.cost}`);
 n.pendingEvent=null;n.message=`Decision recorded: ${option.title}. ${option.detail}`;
 return n;
}

export function optionBlocked(s:SurvivalState,option:DecisionOption){
 if(option.unavailable)return option.unavailable;
 const text=option.cost.replace(/Up to \d+ (kWh|materials)/g,'');
 const materials=Number(text.match(/(\d+) materials/)?.[1]??0),power=Number(text.match(/(\d+) kWh/)?.[1]??0);
 return s.resources.materials<materials?'Not enough materials.':s.resources.power<power?'Not enough battery energy.':undefined;
}
