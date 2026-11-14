import type { CrewMember, SurvivalState } from '../simulation/types';
import { canWork } from '../simulation/scenario';
export const EVA_LIMIT_SECONDS=480;
export function evaTick(c:CrewMember,dt:number,safe:boolean,suited:boolean,oxygen:number,moving:boolean,sprinting:boolean,solarExtra=0):CrewMember {
 const seconds=Math.max(0,Math.min(2,dt));if(!c.alive||!Number.isFinite(seconds))return c;
 const health=Math.max(0,c.health-seconds*(!safe&&(!suited||oxygen<=0)?(suited?5:10):0));
 const fatigue=Math.max(0,Math.min(100,c.fatigue+seconds*(sprinting?.09:moving?.02:safe?-.06:0)));
 const radiationMsv=c.radiationMsv+seconds*(.67+Math.max(0,solarExtra))/88775.244*(safe?.5:1);
 const n={...c,health,fatigue,radiationMsv,alive:health>0,condition:health<=0?'Deceased':health<35?'Incapacitated':fatigue>=60?'Tired':c.condition==='Deceased'?'Recovering':c.condition} as CrewMember;
 n.canWork=canWork(n);return n;
}
export function startRelayFault(s:SurvivalState):SurvivalState {
 if(s.flags.includes('eva-relay-introduced'))return s;
 const n=structuredClone(s);n.flags.push('eva-relay-introduced');n.effects.push({id:'eva-relay-fault',label:'SIMULATION · external power relay fault',untilSol:100000,kind:'solar',productionFactor:.65});n.stats.failures++;
 n.history.push(`Sol ${s.sol}: simulated external relay failure. Solar output reduced 35% until a field repair.`);return n;
}
export function repairEquipment(s:SurvivalState,id:string):SurvivalState {
 if(s.status!=='playing'||s.resources.materials<4||s.resources.power<1)return s;
 const relay=id==='external-relay';const b=s.buildings.find(b=>b.id===id);
 if(relay&&!s.effects.some(e=>e.id==='eva-relay-fault'))return s;
 if(!relay&&(!b||(b.damage??0)<=0))return s;
 const n=structuredClone(s);n.resources.materials-=4;n.resources.power-=1;n.stats.consumed.materials+=4;n.stats.consumed.power+=1;
 if(relay){n.effects=n.effects.filter(e=>e.id!=='eva-relay-fault');n.flags.push('eva-relay-repaired');n.resources.power=Math.min(n.systems.batteryCapacityKwh,n.resources.power+8);n.stats.produced.power+=8;}
 else {const target=n.buildings.find(b=>b.id===id)!;target.damage=0;target.repairUntil=undefined;n.queue=n.queue.filter(q=>q.buildingId!==id);if(target.kind==='habitat'){n.systems.leakRateKpa=0;n.systems.habitatPressureKpa=101.3;}
  if(n.pendingEvent?.buildingId===id){const e=n.pendingEvent;n.completedEvents.push(e.id);n.stats.decisions.push({sol:n.sol,event:e.kind,choice:'Hands-on field repair',explanation:'The astronaut reached the damaged unit and isolated, calibrated and reconnected it.',outcome:'4 materials and 1 kWh used. Output is 90% during two sols of calibration.',sourceId:e.sourceId});n.pendingEvent=null;}
  n.effects.push({id:`field-calibration-${id}-${s.sol}`,label:'Field repair calibration',untilSol:s.sol+2,kind:target.kind,productionFactor:.9});}
 n.message=relay?'Relay restored. Solar output recovered; 8 kWh recovered from the reserve circuit.':'Repair complete. Calibration continues for two sols.';
 n.history.push(`Sol ${s.sol}: ${n.message}`);return n;
}
