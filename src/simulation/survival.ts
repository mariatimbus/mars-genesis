import { commissioningComplete } from './commissioning';
import { modeledWeatherTemperature } from '../nasa/environment';
import type { SurvivalState } from './types';
import { calculateOperations } from './lifeSupport';
import { updateCrew } from './crewHealth';
import { canWork } from './scenario';
import { beginEvent, eventDue } from './events';
export { createScenario, canWork } from './scenario';
export function processQueue(s:SurvivalState):SurvivalState {
 const n=structuredClone(s);
 const postponed=new Set<string>();
 for(const e of s.queue.filter(e=>e.dueSol<=s.sol)){
  if(e.requiresEngineer&&!s.astronauts.some(c=>c.role==='Engineer'&&c.assignment==='maintenance'&&canWork(c))){
   const pending=n.queue.find(q=>q.id===e.id)!;pending.dueSol=n.sol+1;postponed.add(e.id);
   const building=n.buildings.find(b=>b.id===e.buildingId);if(building)building.repairUntil=n.sol+1;
   const warning='Manual repair paused: the engineer must recover and return to maintenance.';n.notifications.push(warning);n.history.push(`Sol ${n.sol}: ${warning}`);continue;
  }
  if(e.type==='repair'){const b=n.buildings.find(b=>b.id===e.buildingId);if(b){b.damage=0;b.repairUntil=undefined;}if(b?.kind==='habitat'){n.systems.leakRateKpa=0;n.systems.habitatPressureKpa=101.3;}}
  if(e.type==='resource'&&e.resource)n.resources[e.resource]=Math.max(0,n.resources[e.resource]+(e.amount??0));
  if(e.type==='crew'){const c=n.astronauts.find(c=>c.id===e.crewId);if(c?.alive){c.fatigue=Math.max(0,Math.min(100,c.fatigue+(e.fatigue??0)));c.health=Math.max(1,Math.min(100,c.health+(e.health??0)));if((e.health??0)<0)c.injury+=8;if(e.assignment)c.assignment=c.health>=35&&c.fatigue<85?e.assignment:'rest';c.condition=c.health<35||c.fatigue>=85?'Incapacitated':c.injury>0?'Injured':c.fatigue>=60?'Tired':c.health<85?'Recovering':'Healthy';if(c.condition==='Incapacitated')c.assignment='rest';c.canWork=canWork(c);}}
  if(e.type==='flag'&&e.flag){n.flags.push(e.flag);if(e.flag==='clean-panels')n.systems.panelEfficiency=1.15;if(e.flag==='priority-oxygen')n.flags=n.flags.filter(f=>f!=='priority-food');}
  n.history.push(`Sol ${n.sol}: ${e.text}`);n.notifications.push(e.text);
 }
 n.queue=n.queue.filter(e=>e.dueSol>s.sol||postponed.has(e.id));
 n.effects=n.effects.filter(e=>e.untilSol>s.sol);
 return n;
}
export function nextSol(s:SurvivalState,{events=true}:{events?:boolean}={}):SurvivalState {
 if(s.pendingEvent||s.status!=='playing'||!commissioningComplete(s))return s;
 const ready=processQueue(s);
 const event=events?eventDue(ready):null;if(event)return beginEvent(ready,event);
 // Archived MEDA extrema drive a synthetic daily cycle; the cycle is not a measured time series.
 ready.environment.temperatureC=modeledWeatherTemperature(ready.sol,ready.seed);
 const {state,report}=calculateOperations(ready);
 let n=updateCrew(state,report);n.sol++;n.lastReport=report;
 n=processQueue(n);
 n.notifications=n.notifications.slice(-12);
 n.history.push(`Sol ${n.sol}: oxygen ${n.resources.oxygen.toFixed(1)} kg, battery ${n.resources.power.toFixed(1)} kWh, food ${n.resources.food.toFixed(1)} kg. ${report.notes.join(' ')}`);
 n.message=report.notes[0]??`Sol ${n.sol}: supplies stable. Check crew fatigue and upcoming alerts.`;
 if(n.crew===0){n.status='lost';n.message='The crew was lost after repeated critical life-support failures. Review the log and try another strategy.';}
 else if(n.sol>=30){const f=calculateOperations(n).report;const sustainable=f.delta.oxygen>=-.01&&f.delta.food>=-.01&&f.safeHabitat&&n.resources.power>=12&&n.astronauts.some(c=>c.alive&&c.health>=35);n.status=sustainable?'won':'lost';n.message=sustainable?'Your crew reached sol 30 with a sustainable colony.':'Sol 30 reached, but the colony needs sustainable food, oxygen, safe habitat and at least 12 kWh reserve to complete the mission.';}
 return n;
}
export function missionScore(s:SurvivalState){const survivors=s.astronauts.filter(c=>c.alive);return Math.max(0,Math.round(s.sol*10+survivors.length*100+survivors.reduce((v,c)=>v+c.health,0)-s.stats.shortages*15+s.systems.research));}
