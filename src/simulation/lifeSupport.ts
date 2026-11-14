import { facilityUnlocked } from './commissioning';
import { observations } from '../nasa/environment';
import balance from '../data/balanceConfig.json';
import type { SurvivalState, SolReport } from './types';
import { canWork } from './scenario';
export const SOL_DAYS=balance.solHours/24;
export function calculateOperations(s:SurvivalState):{state:SurvivalState;report:SolReport} {
 const n=structuredClone(s), before={...s.resources};
 const buildings=s.buildings.filter(b=>facilityUnlocked(s,b.kind));
 const activeEffects=s.effects.filter(e=>e.untilSol>s.sol);
 const sheltered=activeEffects.some(e=>e.shelter);
 const shutdown=activeEffects.some(e=>e.researchOff);
 const dust=s.environment.dustUntil>s.sol?s.environment.dustFactor:1;
 const factor=(kind:string)=>activeEffects.filter(e=>e.productionFactor!==undefined&&(!e.kind||e.kind===kind)).reduce((v,e)=>v*e.productionFactor!,1);
 const living=s.astronauts.filter(c=>c.alive);
 const workers=living.filter(canWork);
 const botanist=workers.find(c=>c.role==='Botanist'&&c.assignment==='greenhouse');
 const efficiency=(c:typeof botanist)=>c?(c.health/100)*(1-c.fatigue/200)*(.8+c.morale/500):0;
 const scientist=workers.find(c=>c.role==='Scientist / Medic'&&c.assignment==='research');
 const generated=buildings.filter(b=>b.kind==='solar'&&b.active).reduce((v,b)=>v+balance.solarKwhPerArraySol*(1-(b.damage??0)/100)*dust*s.systems.panelEfficiency*activeEffects.filter(e=>e.kind==='solar'&&e.productionFactor!==undefined).reduce((n,e)=>n*e.productionFactor!,1),0);
 let energy=s.resources.power+generated;
 const powered:Record<string,number>={};
 let used=0;
 const spend=(demand:number)=>{if(energy+1e-8<demand)return false;energy-=demand;used+=demand;return true};
 // Habitat air circulation and CO2 scrubbing are the highest-priority loads.
 const habitats=buildings.filter(b=>b.kind==='habitat'&&b.active&&(b.damage??0)<80);
 const heat=s.environment.temperatureC<-75?2:0;
 for(const h of habitats)powered[h.id]=spend(balance.habitatKwhPerSol+heat)?1:0;
 const safeVolume=habitats.length*4>=living.length;
 const co2Removal=habitats.some(b=>powered[b.id]>0)&&spend(3)&&safeVolume;
 // The water loop comes before crop production; medical equipment follows oxygen and food.
 for(const b of buildings.filter(b=>b.kind==='water')){
  powered[b.id]=b.active&&(b.damage??0)<80&&spend(balance.waterKwhPerSol)?1:0;
 }
 const waterOnline=buildings.some(b=>b.kind==='water'&&powered[b.id]>0);
 n.systems.recycling=waterOnline?balance.waterRecyclingFraction:0;
 const oxygenFirst=!s.flags.includes('priority-food');
 const order=oxygenFirst?['oxygen','greenhouse','medical','research','storage']:['greenhouse','oxygen','medical','research','storage'];
 let oxygenProduced=0, foodProduced=0, materialProduced=0;
 for(const kind of order)for(const b of buildings.filter(b=>b.kind===kind)){
  powered[b.id]=0;
  if(!b.active||(b.damage??0)>=80||(kind==='research'&&(shutdown||sheltered)))continue;
  let f=factor(kind)*(1-(b.damage??0)/100);
  if(sheltered)f*=kind==='research'?0:.4;
  if(kind==='storage')continue;
  if(kind==='medical'){powered[b.id]=spend(balance.medicalKwhPerSol)?1:0;continue;}
  const demand=(kind==='oxygen'?balance.oxygenKwhPerSol:kind==='greenhouse'?balance.greenhouseKwhPerSol:balance.researchKwhPerSol)*f;
  const water=kind==='oxygen'?balance.oxygenKgPerPlantSol*f*balance.waterKgPerOxygenKg:kind==='greenhouse'?balance.waterKgPerGreenhouseSol*f:0;
  if(n.systems.waterKg<water||!spend(demand))continue;
  powered[b.id]=f;n.systems.waterKg-=water;
  if(kind==='oxygen')oxygenProduced+=balance.oxygenKgPerPlantSol*f;
  if(kind==='greenhouse')foodProduced+=balance.foodKgPerGreenhouseSol*f*(.8+.35*efficiency(botanist));
  if(kind==='research'){n.systems.research+=balance.researchPointsPerLabSol*f*(1+.3*efficiency(scientist));materialProduced+=balance.materialsPerLabSol*f;}
 }
 const demandFactor=activeEffects.reduce((v,e)=>v*(e.oxygenDemandFactor??1),1);
 const ration=activeEffects.reduce((v,e)=>v*(e.rationFactor??1),1);
 const oxygenDemand=living.length*observations.oxygen.kgPerPersonPerEarthDay*SOL_DAYS*demandFactor;
 const normalFood=living.length*balance.foodKgPerEarthDay*SOL_DAYS;
 const waterDemand=living.length*balance.waterKgPerEarthDay*SOL_DAYS*(1-n.systems.recycling);
 n.resources.oxygen+=oxygenProduced;
 // Oxygen backup is released automatically, not confused with cabin pressure.
 if(n.resources.oxygen<oxygenDemand){const backup=Math.min(n.systems.backupOxygenKg,oxygenDemand-n.resources.oxygen);n.resources.oxygen+=backup;n.systems.backupOxygenKg-=backup;}
 const oxygenCoverage=oxygenDemand?Math.min(1,n.resources.oxygen/oxygenDemand):1;
 const foodAvailable=s.resources.food+foodProduced;
 const eaten=Math.min(foodAvailable,normalFood*ration);
 const foodCoverage=normalFood?eaten/normalFood:1;
 const waterCoverage=waterDemand?Math.min(1,n.systems.waterKg/waterDemand):1;
 n.resources.oxygen=Math.max(0,n.resources.oxygen-oxygenDemand);
 n.resources.food=Math.max(0,foodAvailable-eaten);
 n.resources.materials+=materialProduced;
 n.resources.power=Math.min(n.systems.batteryCapacityKwh,Math.max(0,energy));
 n.systems.waterKg=Math.max(0,n.systems.waterKg-waterDemand);
 // Recycling does not make water from nothing. Depot ice extraction is a separate powered operation.
 const depots=buildings.filter(b=>b.kind==='storage'&&b.active&&(b.damage??0)<80).length;
 if(waterOnline&&depots&&spend(2)){
  for(const b of buildings.filter(b=>b.kind==='storage'&&b.active&&(b.damage??0)<80))powered[b.id]=1;n.systems.waterKg=Math.min(150,n.systems.waterKg+depots*2);n.resources.power=Math.min(n.systems.batteryCapacityKwh,Math.max(0,energy));}
 n.systems.habitatPressureKpa=Math.max(s.environment.outsidePressurePa/1000,n.systems.habitatPressureKpa-n.systems.leakRateKpa);
 n.systems.co2Percent=co2Removal?Math.max(.04,s.systems.co2Percent-.2):Math.min(4,s.systems.co2Percent+.28);
 n.systems.shelterActive=sheltered;
 const safeHabitat=safeVolume&&n.systems.habitatPressureKpa>=70;
 const notes=[];
 if(oxygenCoverage<1)notes.push('Oxygen demand could not be met, including backup reserves.');
 if(foodCoverage<.95)notes.push('Crew ate less than their normal daily ration. Fatigue may build.');
 if(!co2Removal)notes.push('CO₂ removal is offline. Restore habitat power.');
 if(!safeHabitat)notes.push('Insufficient safe, powered habitat volume or low cabin pressure.');
 const delta=Object.fromEntries(Object.entries(before).map(([k,v])=>[k,n.resources[k as keyof typeof before]-v])) as typeof before;
 const produced={oxygen:oxygenProduced,power:generated,food:foodProduced,materials:materialProduced};
 const consumed={oxygen:Math.min(oxygenDemand,before.oxygen+oxygenProduced+(s.systems.backupOxygenKg-n.systems.backupOxygenKg)),power:used,food:eaten,materials:0};
 for(const key of Object.keys(produced) as (keyof typeof before)[]){n.stats.produced[key]+=produced[key];n.stats.consumed[key]+=consumed[key];}
 const report:SolReport={delta,generatedKwh:generated,usedKwh:used,oxygenDemandKg:oxygenDemand,foodDemandKg:normalFood,oxygenCoverage,foodCoverage,waterCoverage,powered,safeHabitat,co2Removal,notes};
 return {state:n,report};
}
export function oxygenSols(s:SurvivalState){const count=s.astronauts.filter(c=>c.alive).length;return count?(s.resources.oxygen+s.systems.backupOxygenKg)/(count*observations.oxygen.kgPerPersonPerEarthDay*SOL_DAYS):0;}
