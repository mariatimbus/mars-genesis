import { freshCommissioning } from './commissioning';
import { initialBuildings } from './engine';
import type { CrewMember, Difficulty, SurvivalState } from './types';
import { observations } from '../nasa/environment';
import balance from '../data/balanceConfig.json';
export function randomStep(seed:number){const next=(Math.imul(seed,1664525)+1013904223)>>>0;return {seed:next,value:next/4294967296}}
export const canWork=(c:CrewMember)=>c.alive&&!['Incapacitated','Deceased'].includes(c.condition)&&c.health>=35&&c.fatigue<85&&!['rest','shelter'].includes(c.assignment);
export function createScenario(seed=2026,difficulty:Difficulty='commander',scenario:SurvivalState['scenario']='solar-watch'):SurvivalState {
 const factor={cadet:1.7,commander:1,expert:.65}[difficulty];
 const roles:[string,CrewMember['role'],CrewMember['assignment']][]=[['Maya Chen','Commander','command'],['Alex Rivera','Engineer','maintenance'],['Sam Okafor','Botanist','greenhouse'],['Leila Haddad','Scientist / Medic','medical']];
 const astronauts:CrewMember[]=roles.map(([name,role,assignment],i)=>({id:`crew-${i}`,name,role,assignment,health:100,fatigue:12,morale:85,radiationMsv:0,condition:'Healthy',canWork:true,alive:true,oxygenDebt:0,hungerSols:0,injury:0,note:'Ready for the mission.'}));
 return {commissioning:freshCommissioning(),expandedPlots:[],sol:1,crew:4,astronauts,resources:{oxygen:14*factor,power:Math.min(160,85*factor),food:13*factor,materials:Math.round(160*factor)},buildings:initialBuildings.map(b=>({...b,damage:0})),
 environment:{dustUntil:0,dustFactor:1,radiationUntil:0,radiationExtraMsv:0,temperatureC:-63,outsidePressurePa:700,commDelayMinutes:observations.communications.oneWayMinMinutes+Math.floor(randomStep(seed).value*(observations.communications.oneWayMaxMinutes-observations.communications.oneWayMinMinutes+1))},
 systems:{waterKg:50*factor,recycling:0,backupOxygenKg:balance.oxygenReserveKg*factor,batteryCapacityKwh:160,habitatPressureKpa:101.3,co2Percent:.04,leakRateKpa:0,shelterActive:false,research:0,panelEfficiency:1},effects:[],queue:[],pendingEvent:null,completedEvents:[],flags:[],seed:seed>>>0,rng:seed>>>0,scenario,difficulty,status:'playing',message:'Six rooms are waiting. Complete 18 hands-on training tasks to wake the colony.',history:[],notifications:[],stats:{shortages:0,failures:0,constructed:0,produced:{oxygen:0,power:0,food:0,materials:0},consumed:{oxygen:0,power:0,food:0,materials:0},decisions:[]},lastReport:null};
}
