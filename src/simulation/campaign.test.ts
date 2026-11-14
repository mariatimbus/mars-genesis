import { describe,it,expect } from 'vitest';
import { nextSol } from './survival';
import { readyScenario as createScenario } from './testHelpers';
import { applyDecision,decisionOptions,optionBlocked } from './events';
import { catalog,validPlacement } from './engine';
import type { Assignment,SurvivalState } from './types';
function play(seed:number,careful:boolean){
 let s=createScenario(seed,'commander');
 if(careful){for(const [kind,x,z] of [['solar',20,-18],['storage',-20,17],['storage',-12,18]] as const){if(validPlacement(kind,x,z,s.buildings)){s.buildings.push({id:`prepare-${kind}-${x}`,kind,x,z,active:true});s.resources.materials-=catalog[kind].cost;}}}
 const regular:Assignment[]=['command','maintenance','greenhouse','medical'];
 for(let step=0;step<55&&s.status==='playing';step++){
  if(careful)s.astronauts=s.astronauts.map((c,i)=>({...c,assignment:c.fatigue>=60||c.condition==='Incapacitated'?'rest':c.fatigue<22?regular[i]:c.assignment}));
  s=nextSol(s);
  if(s.pendingEvent){const options=decisionOptions(s);const preferred=careful?(s.pendingEvent.kind==='solar'?'shelter':s.pendingEvent.kind==='dust'?'lifesupport':s.pendingEvent.kind==='communication'?'wait':s.pendingEvent.kind==='leak'?'isolate':'repair'):'ration';const choice=options.find(o=>o.id===preferred&&!optionBlocked(s,o))??options.find(o=>!optionBlocked(s,o));if(choice)s=applyDecision(s,choice.id);}
 }
 return s;
}
describe('end-to-end deterministic campaigns',()=>{
 it('a prepared crew can complete all six event types and win',()=>{const s=play(2026,true);expect(s.stats.decisions.length).toBeGreaterThanOrEqual(6);expect(s.status,s.message+JSON.stringify(s.resources)).toBe('won');expect(s.crew).toBe(4)});
 it('changing preparation and choices changes the same-seed outcome',()=>{const prepared=play(2026,true),unprepared=play(2026,false);expect(unprepared).not.toEqual(prepared);expect(unprepared.astronauts.map(c=>c.health)).not.toEqual(prepared.astronauts.map(c=>c.health))});
});
