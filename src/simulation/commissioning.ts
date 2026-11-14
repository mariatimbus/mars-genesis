import { validPlacement, type Kind } from './engine';
import type { SurvivalState } from './types';

export const STARTUP_KINDS=['solar','habitat','medical','water','research','greenhouse','oxygen'] as const;
export type StartupKind=typeof STARTUP_KINDS[number];
export interface CommissioningState {
 completed:StartupKind[];
 attempts:Partial<Record<StartupKind,number>>;
 feedback:{kind:StartupKind;correct:boolean;text:string}|null;
}
interface StartupChallenge {
 kind:StartupKind;label:string;title:string;brief:string;question:string;
 options:{id:string;text:string;correct?:boolean;feedback:string}[];
 outcome:string;
}
export const STARTUP_CHALLENGES:StartupChallenge[]=[
 {kind:'solar',label:'Energy',title:'Wake up the power grid',brief:'The solar arrays arrived folded and disconnected. Your lander battery is the only reserve.',question:'Which startup plan gives the colony a reliable source of power?',options:[
  {id:'battery',text:'Run every system from the lander battery.',feedback:'A battery stores a limited supply. Bring the solar arrays online before relying on it.'},
  {id:'align',text:'Deploy the arrays, clear dust and connect them to the battery.',correct:true,feedback:'The arrays now generate electricity and recharge the battery. Stored energy can cover short interruptions.'},
  {id:'night',text:'Wait until night to deploy the panels.',feedback:'Solar panels need sunlight to generate electricity. Prepare them while sunlight is available.'}],outcome:'Solar arrays commissioned. Energy generation unlocked.'},
 {kind:'habitat',label:'Crew',title:'Make a home for the crew',brief:'The habitats are assembled, but the crew is still waiting inside the landing capsule.',question:'What must be checked before the crew moves in?',options:[
  {id:'pressure',text:'Seal the airlocks, check pressure and test air circulation.',correct:true,feedback:'The sealed habitats are ready for the crew. Power will run heating, circulation and carbon dioxide removal.'},
  {id:'open',text:'Open both airlock doors to let fresh Martian air in.',feedback:'Martian air cannot replace a protected, pressurized habitat. Keep the airlocks sealed.'},
  {id:'beds',text:'Install beds and move everyone in without testing the air.',feedback:'Beds alone cannot make a habitat safe. Test pressure and the air-handling systems first.'}],outcome:'Crew habitats commissioned. Safe living space unlocked.'},
 {kind:'medical',label:'Health',title:'Prepare the medical bay',brief:'The crew has spent months in transit. Leila needs a safe place for checkups and recovery.',question:'How should the medical bay be prepared?',options:[
  {id:'work',text:'Skip the checkups and put every crew member on an extra shift.',feedback:'More work adds fatigue. A prepared medical bay and time to rest support crew recovery.'},
  {id:'store',text:'Use the bay as a cargo room and leave the equipment packed.',feedback:'Packed equipment cannot support the medic. Keep the treatment and recovery area available.'},
  {id:'check',text:'Test the medical equipment and set up checkups and a rest area.',correct:true,feedback:'Leila can now use the powered medical bay to support recovery. Rest and reliable life support still matter.'}],outcome:'Medical bay commissioned. Medic-assisted recovery unlocked.'},
 {kind:'water',label:'Water',title:'Close the water loop',brief:'Water is needed for drinking, crops and oxygen production. The colony cannot depend on its landing supply forever.',question:'Which plan stretches the reserve without pretending water is unlimited?',options:[
  {id:'reuse',text:'Filter and treat used water, then extract local ice to replace losses.',correct:true,feedback:'The powered water facility recycles part of the crew’s water use. Depots extract ice to replace losses; oxygen and crops still consume water.'},
  {id:'discard',text:'Discard all used water and use only the landing tanks.',feedback:'The tanks are finite. Recover usable water and replace unavoidable losses.'},
  {id:'unlimited',text:'Assume recycling creates a new, unlimited water supply.',feedback:'Recycling recovers water already in the system. It does not create water from nothing.'}],outcome:'Water facility commissioned. Recycling and depot ice extraction unlocked.'},
 {kind:'research',label:'Research lab',title:'Start the first experiment',brief:'The research lab must be checked before it can study materials and support the colony.',question:'What makes the first experiment useful?',options:[
  {id:'guess',text:'Write the result you expect without taking measurements.',feedback:'An expectation is a hypothesis, not a result. The crew needs recorded measurements.'},
  {id:'measure',text:'Calibrate the instruments, change one condition and record the results.',correct:true,feedback:'The lab is ready for measured experiments. Powered research earns science points and recovers construction materials.'},
  {id:'change',text:'Change every setting at once and keep no record.',feedback:'Changing everything without records makes it hard to understand what caused a result.'}],outcome:'Research lab commissioned. Science and material recovery unlocked.'},
 {kind:'greenhouse',label:'Greenhouse',title:'Plant the first harvest',brief:'Sam has seeds ready. The greenhouse climate controller has never been switched on.',question:'Which setup gives the crops a protected growing environment?',options:[
  {id:'outside',text:'Plant the seeds outside in exposed Martian soil.',feedback:'The crops need a protected environment. Exposed terrain does not provide the greenhouse conditions they need.'},
  {id:'dry',text:'Seal the greenhouse but leave irrigation disconnected.',feedback:'A sealed room is not enough. Crops also need water, light, nutrients and climate control.'},
  {id:'climate',text:'Test irrigation, light, temperature and the protected growing beds.',correct:true,feedback:'The greenhouses are ready to produce food when power and water are available. Sam’s greenhouse assignment improves yield.'}],outcome:'Greenhouses commissioned. Food production unlocked.'},
 {kind:'oxygen',label:'Oxygen',title:'Take the first breath',brief:'The oxygen units are installed. The crew is still relying on the oxygen delivered from Earth.',question:'How should the oxygen system be brought online?',options:[
  {id:'electrolysis',text:'Connect treated water and power, test electrolysis and check for leaks.',correct:true,feedback:'The oxygen plants can now use water and electricity to replenish breathable oxygen. Stored backup remains a reserve.'},
  {id:'outside',text:'Pump outside air directly into the crew habitats.',feedback:'Outside Martian air cannot supply the crew with breathable oxygen. Use the oxygen production system.'},
  {id:'reserve',text:'Use up the backup tanks before checking the production units.',feedback:'Keep backup oxygen for interruptions. Commission production before depending on the reserve.'}],outcome:'Oxygen plants commissioned. Breathable oxygen production unlocked.'},
];
export const startupKind=(kind:Kind):StartupKind=>kind==='storage'?'water':kind;
export const facilityUnlocked=(s:Pick<SurvivalState,'commissioning'>,kind:Kind)=>s.commissioning.completed.includes(startupKind(kind));
export const commissioningComplete=(s:Pick<SurvivalState,'commissioning'>)=>STARTUP_KINDS.every(k=>s.commissioning.completed.includes(k));
export const freshCommissioning=():CommissioningState=>({completed:[],attempts:{},feedback:null});
export function answerStartup(s:SurvivalState,kind:StartupKind,answerId:string):SurvivalState {
 if(s.status!=='playing'||s.pendingEvent||s.commissioning.completed.includes(kind))return s;
 const challenge=STARTUP_CHALLENGES.find(c=>c.kind===kind),answer=challenge?.options.find(o=>o.id===answerId);
 if(!challenge||!answer||!s.buildings.some(b=>b.kind===kind))return s;
 const n=structuredClone(s);
 n.commissioning.attempts[kind]=(n.commissioning.attempts[kind]??0)+1;
 n.commissioning.feedback={kind,correct:!!answer.correct,text:answer.feedback};
 if(!answer.correct)return n;
 n.commissioning.completed.push(kind);
 n.buildings=n.buildings.map(b=>startupKind(b.kind)===kind?{...b,active:true}:b);
 n.history.push(`Sol ${n.sol}: startup challenge completed — ${challenge.label}. ${challenge.outcome}`);
 n.message=commissioningComplete(n)?'All seven startup challenges completed. The colony is ready. Advance your first sol.':challenge.outcome;
 return n;
}
// Legacy missions keep their running systems and progress. New missions always start offline.
export function migrateStartup(s:SurvivalState):SurvivalState {
 const n=structuredClone(s),ongoing=n.sol>1;
 n.commissioning=ongoing?{completed:[...STARTUP_KINDS],attempts:{},feedback:null}:freshCommissioning();
 for(const [kind,preferredX,preferredZ] of [['medical',-16,-14],['water',10,-15]] as const){
  if(n.buildings.some(b=>b.kind===kind))continue;
  const locations:[[number,number],...[number,number][]]=[[preferredX,preferredZ]];
  for(let z=-19;z<=19;z+=6)for(let x=-21;x<=21;x+=6)locations.push([x,z]);
  const location=locations.find(([x,z])=>validPlacement(kind,x,z,n.buildings,n.expandedPlots));
  if(location)n.buildings.push({id:`startup-${kind}`,kind,x:location[0],z:location[1],active:ongoing,damage:0});
 }
 if(!ongoing){n.buildings=n.buildings.map(b=>({...b,active:false}));n.message='Seven systems are waiting. Complete each startup challenge to bring the colony online.';}
 return n;
}
