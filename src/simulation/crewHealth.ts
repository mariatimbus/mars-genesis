import { observations } from '../nasa/environment';
import balance from '../data/balanceConfig.json';
import { SOL_DAYS } from './lifeSupport';
import { canWork } from './scenario';
import type { CrewMember, SolReport, SurvivalState } from './types';
const clamp=(x:number)=>Math.max(0,Math.min(100,x));
export function exposureFor(s:SurvivalState,c:CrewMember){
 const shelter=s.effects.some(e=>e.shelter&&e.untilSol>s.sol)||c.assignment==='shelter';
 const external=c.assignment==='maintenance'&&s.environment.dustUntil<=s.sol&&!s.effects.some(e=>e.constructionHold&&e.untilSol>s.sol);
 const protection=shelter?balance.shelterRadiationFactor:external?1:balance.habitatRadiationFactor;
 const extra=s.environment.radiationUntil>s.sol?s.environment.radiationExtraMsv:0;
 const redirect=s.effects.filter(e=>e.untilSol>s.sol).reduce((v,e)=>v*(e.exposureFactor??1),1);
 return (observations.radiation.doseEquivalentMsvPerEarthDay*SOL_DAYS+extra)*protection*redirect;
}
export function updateCrew(s:SurvivalState,r:SolReport):SurvivalState {
 const medic=s.astronauts.some(c=>c.role==='Scientist / Medic'&&c.assignment==='medical'&&canWork(c))&&s.buildings.some(b=>b.kind==='medical'&&b.active&&(r.powered[b.id]??0)>0);
 const commander=s.astronauts.some(c=>c.role==='Commander'&&c.assignment==='command'&&canWork(c));
 const n=structuredClone(s);
 n.astronauts=n.astronauts.map(c=>{
  if(!c.alive)return c;
  const old=c.condition,rest=c.assignment==='rest'||c.assignment==='shelter'||s.systems.shelterActive;
  c.radiationMsv+=exposureFor(s,c); // Educational exposure only; never an acute sickness rule.
  c.oxygenDebt=r.oxygenCoverage<.95?c.oxygenDebt+1:Math.max(0,c.oxygenDebt-1);
  c.hungerSols=r.foodCoverage<.95?c.hungerSols+1:Math.max(0,c.hungerSols-1);
  const shortage=c.oxygenDebt>0||r.waterCoverage<.9||!r.safeHabitat||s.systems.co2Percent>.8;
  let damage=0;
  if(c.oxygenDebt)damage+=(6+c.oxygenDebt*7)*(1-r.oxygenCoverage);
  if(c.hungerSols>=3)damage+=Math.min(14,3+c.hungerSols)*(1-r.foodCoverage);
  if(r.waterCoverage<.9)damage+=8*(1-r.waterCoverage);
  if(!r.safeHabitat)damage+=s.systems.habitatPressureKpa<50?18:7;
  if(s.systems.co2Percent>.8)damage+=6;
  c.fatigue=clamp(c.fatigue+(rest?-22:c.morale>=80?4:6)+(1-r.foodCoverage)*18+(shortage?12:0));
  if(c.injury>0){c.injury=Math.max(0,c.injury-(rest?12:medic?6:2));}
  const recovering=damage===0&&r.foodCoverage>=.95&&r.waterCoverage>=.9;
  c.health=clamp(c.health-damage+(recovering?(rest?7:medic?4:1):0));
  c.morale=clamp(c.morale+(shortage?-8:commander?2:1)-(r.foodCoverage<.9?3:0));
  if(c.health<=0){c.alive=false;c.condition='Deceased';c.canWork=false;c.note='Lost after sustained life-support failures. Review the mission log to learn what led here.';}
  else if(c.health<35||c.fatigue>=85){c.condition='Incapacitated';c.canWork=false;c.assignment='rest';c.note='Needs rest and reliable air, food and water before returning to work.';}
  else {c.condition=c.injury>0?'Injured':shortage?'Ill':c.health<85?'Recovering':c.fatigue>=60?'Tired':'Healthy';c.canWork=canWork(c);c.note=shortage?'Life-support shortages are affecting health.':c.hungerSols>0?'Reduced meals are building fatigue.':rest?'Rest is reducing fatigue and supporting recovery.':'Working conditions are stable.';}
  if(c.condition!==old){const text=`${c.name}: ${old} → ${c.condition}. ${c.note}`;n.notifications.push(text);n.history.push(`Sol ${s.sol+1}: ${text}`);}
  return c;
 });
 n.crew=n.astronauts.filter(c=>c.alive).length;
 if(r.oxygenCoverage<.95||r.foodCoverage<.95||!r.safeHabitat)n.stats.shortages++;
 return n;
}
