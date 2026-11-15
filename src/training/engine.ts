import { dependencies, roomTasks, taskById, tasks, type TaskId, type TrainingRoom } from './catalog';
import type { SurvivalState } from '../simulation/types';
export interface TaskState {values:number[];marks:number[];phase:number;time:number;mistakes:number;done:boolean;note:string}
export interface TaskRecord {stars:1|2|3;mistakes:number;credits:number}
export interface TrainingProgress {tasks:Partial<Record<TaskId,TaskState>>;records:Partial<Record<TaskId,TaskRecord>>;credits:number;messageSentAt:number|null;messageDueAt:number|null;replyDueAt:number|null;weatherUnlocked:boolean}
export interface TaskAction {type:string;index?:number;value?:number}
export const freshTraining=():TrainingProgress=>({tasks:{},records:{},credits:0,messageSentAt:null,messageDueAt:null,replyDueAt:null,weatherUnlocked:false});
export function initialTask(id:TaskId):TaskState {
 const values:Partial<Record<TaskId,number[]>>={dust:Array(12).fill(2),sun:[0,0,0],battery:circuitStart(),scan:[0],melt:[0,0,0,-20,0,0,0,0],fill:[0],split:[0,0,0],air:[50,0,0],lights:[0,0,0],plant:[-1,-1,-1],irrigate:[10,20,10],gravity:[1],antenna:[0,0,12],rock:[0]};
 return {values:values[id]??[],marks:[],phase:0,time:0,mistakes:0,done:false,note:''};
}
const clamp=(v:number,min=0,max=100)=>Math.min(max,Math.max(min,v));
export const sunAngle=(time:number)=>Math.round(45+25*Math.sin(time*.18));
export const lightCapture=(angle:number,time:number)=>Math.max(0,Math.cos((angle-sunAngle(time))*Math.PI/180));
// 6×6 cable board. Each colour joins two device ports; cables cannot cross or pass the rock tile.
export const CIRCUIT_SIZE=6,CIRCUIT_ROCK=19;
export const circuitCables=[
 {color:1,name:'Red',from:'Solar array',to:'Charge controller',ports:[0,15]},
 {color:2,name:'Blue',from:'Charge controller',to:'Battery',ports:[4,35]},
 {color:3,name:'Yellow',from:'Battery',to:'Oxygen maker',ports:[10,21]},
 {color:4,name:'Green',from:'Battery',to:'Water pump',ports:[6,28]},
 {color:5,name:'Purple',from:'Battery',to:'Habitat lights',ports:[12,34]}
];
export const circuitPortAt=(cell:number)=>{for(const c of circuitCables){const end=c.ports.indexOf(cell);if(end>=0)return {cable:c,end};}return null};
export function circuitStart(){const v:number[]=Array(CIRCUIT_SIZE*CIRCUIT_SIZE).fill(0);for(const c of circuitCables)for(const p of c.ports)v[p]=c.color;v[CIRCUIT_ROCK]=-1;return v}
export const circuitNeighbours=(cell:number)=>{const r=Math.floor(cell/CIRCUIT_SIZE),c=cell%CIRCUIT_SIZE,n:number[]=[];if(r>0)n.push(cell-CIRCUIT_SIZE);if(r<CIRCUIT_SIZE-1)n.push(cell+CIRCUIT_SIZE);if(c>0)n.push(cell-1);if(c<CIRCUIT_SIZE-1)n.push(cell+1);return n};
export function cableComplete(values:number[],color:number){
 const cable=circuitCables.find(c=>c.color===color);if(!cable)return false;
 const seen=new Set([cable.ports[0]]),queue=[cable.ports[0]];
 while(queue.length){const cell=queue.shift()!;if(cell===cable.ports[1])return true;for(const n of circuitNeighbours(cell))if(!seen.has(n)&&values[n]===color){seen.add(n);queue.push(n)}}
 return false;
}
export const circuitConnected=(values:number[])=>values.length===CIRCUIT_SIZE*CIRCUIT_SIZE&&circuitCables.every(c=>cableComplete(values,c.color));
export const airDemand=(time:number)=>Math.round(40+14*Math.sin(time*.35));
export const crewActivity=(time:number)=>{const d=airDemand(time);return d>=48?'Exercising':d<=32?'Sleeping':'Working'};
export const iceColumns=[0,0,1,2,2,0]; // 0 basalt; 1 frozen regolith; 2 teaching ice lens
export const irrigationBands=[[40,60],[50,70],[30,50]];
export const gravityNotes=['Maya: Muscles that do not have to fight gravity get smaller and weaker. Exercise makes them work hard again!','Maya: Bones are alive. When they carry less weight, the body takes some bone away. Running and lifting tell bones to stay strong.','Maya: Joints need movement. Moving keeps the cartilage that cushions them healthy and keeps us flexible.'];
export const ANTENNA_PAUSE=2;
export const antennaTrip=(oneWayMinutes:number)=>2*oneWayMinutes+2*ANTENNA_PAUSE; // out, Earth replies, back, a moment to read it on Mars
export const kitTargets=[0,1,2,3,3]; // wounds, illness, radiation monitoring, checkup
export function blockedRoom(s:Pick<SurvivalState,'commissioning'>,room:TrainingRoom){return dependencies[room].filter(k=>!s.commissioning.completed.includes(k))}
export function taskAvailable(s:Pick<SurvivalState,'commissioning'>,id:TaskId){
 const t=taskById(id);if(!t||blockedRoom(s,t.room).length)return false;
 const steps=roomTasks(t.room),index=steps.findIndex(t=>t.id===id);
 return steps.slice(0,index).every(t=>!!s.commissioning.training.records[t.id]);
}
export function taskStars(t:TaskState):1|2|3 {return t.mistakes===0?3:t.mistakes<=2?2:1}
export function reduceTask(id:TaskId,current:TaskState,a:TaskAction):TaskState {
 if(current.done||!tasks.some(t=>t.id===id)||a.value!==undefined&&!Number.isFinite(a.value)||a.index!==undefined&&!Number.isInteger(a.index))return current;
 const t=structuredClone(current),v=t.values,m=t.marks,i=a.index??-1,value=a.value??0;
 const fail=(note:string)=>{t.mistakes++;t.note=note};
 const finish=()=>{t.done=true;t.note='Training complete. Your discovery page is ready.'};
 const is=(type:string)=>a.type===type;
 const valid=(count:number)=>i>=0&&i<count;
 const tick=is('tick')?clamp(value,0,.5):0;
 if(tick)t.time+=tick;
 switch(id){
 case 'dust':
  if(is('wipe')&&valid(12)&&v[i]>0){v[i]--;t.note='Dust cleared: more light reaches the cells.';if(t.phase===0&&v.filter(x=>x===0).length>=6){t.phase=1;v[0]=1;t.note='A small gust returned dust to cell 1. Sweep it once more.';}if(v.every(x=>x===0))finish();}break;
 case 'sun':
  if(is('angle'))v[0]=clamp(value,0,90);
  if(tick){if(Math.abs(v[0]-sunAngle(t.time))<=12){v[1]+=tick;v[2]=0;}else{v[2]+=tick;if(v[2]>=4){fail('The panel is losing light. Follow the yellow Sun marker.');v[2]=0;}}if(v[1]>=15)finish();}break;
 case 'battery':
  if(is('draw')&&valid(CIRCUIT_SIZE*CIRCUIT_SIZE)&&v[i]===0&&circuitCables.some(c=>c.color===value))v[i]=value;
  if(is('erase')&&circuitCables.some(c=>c.color===value))v.forEach((n,cell)=>{if(n===value&&!circuitPortAt(cell))v[cell]=0});
  if(is('connect')){if(circuitConnected(v))finish();else{const open=circuitCables.filter(c=>!cableComplete(v,c.color)).map(c=>c.name.toLowerCase());fail(`Open circuit: the ${open.join(', ')} cable${open.length>1?'s are':' is'} not complete.`);}}break;
 case 'scan':
  if(is('move'))v[0]=clamp(Math.round(value),0,5);
  if(is('scan')){if(!m.includes(v[0]))m.push(v[0]);const layer=iceColumns[v[0]];t.note=layer===2?'Blue return: an ice-rich teaching sample. You can drill here.':layer===1?'Frozen soil. Try the next column.':'Basalt return. Try another position.';if(layer!==2) t.mistakes++;}
  if(is('dig')){if(m.includes(v[0])&&iceColumns[v[0]]===2)finish();else fail('Scan and locate the blue ice return before drilling.');}break;
 case 'melt':
  if(is('load')&&v[4]===0){v[0]=1;v[3]=-20;t.note='Ice loaded. Seal and pressurize the tank.';}
  if(is('lid')){v[1]=v[1]?0:1;if(!v[1]){v[2]=0;v[7]=0;}}
  if(is('pump')){if(v[1])v[2]=clamp(v[2]+20,0,120);else fail('Close the lid before pressurizing.');}
  if(is('heat')){
   if(value===1){if(!v[0])fail('Load ice first.');else if(!v[1]||v[2]<50||v[2]>90){v[0]=0;v[5]++;v[7]=0;fail('The sample was lost. Reload, seal and pump into the green band.');}else v[7]=1;}
   else{v[7]=0;if(v[4]>=100)finish();}
  }
  if(tick&&v[7]){v[6]+=tick;if(v[3]<0)v[3]=Math.min(0,v[3]+tick*10);else if(v[4]<100)v[4]=Math.min(100,v[4]+tick*10);else{v[3]+=tick*5;if(v[3]>=5&&t.phase===0){t.phase=1;fail('All the ice is melted. Stop heating to save electricity.');}}}
  break;
 case 'filter':
  if(is('choose')&&valid(3)&&!m.includes(i)&&m.length<3){m.push(i);t.phase=0;}
  if(is('clear')){t.marks=[];t.phase=0;}
  if(is('run')){if(m.length===3&&m.every((n,j)=>n===j)){t.phase=1;t.note='Coarse debris, dust and dissolved salts removed in the model.';}else{fail('The fine barrier clogged. Clear the column; start with coarse debris.');t.phase=0;}}
  if(is('test')){if(t.phase===1)finish();else fail('Arrange the filters and run the water before testing.');}break;
 case 'fill':
  if(is('pour')){v[0]=clamp(v[0]+10);if(v[0]>60)fail('The cell is overfilled. Other systems need this water too.');}
  if(is('drain'))v[0]=clamp(v[0]-10);
  if(is('connect')){if(v[0]===60)finish();else fail('Match the green line at 60 units before connecting.');}break;
 case 'split':
  if(is('load'))t.phase=1;
  if(is('current')){if(t.phase===1){t.phase=2;t.note='Two water molecules separated: four H atoms and two O atoms.';}else if(t.phase===0)fail('Move the two H₂O molecules into the electrodes first.');}
  if(is('sort')&&t.phase===2&&valid(6)&&!m.includes(i)){
   const atom=i%3===0?1:0; // red O at 0,3; white H at 1,2,4,5
   if(value===atom){m.push(i);v[atom]++;if(m.length===6)finish();}else fail('White H goes to hydrogen; red O goes to oxygen.');
  }break;
 case 'air':
  if(is('valve'))v[1]=clamp(value);
  if(tick){v[0]=clamp(v[0]+(v[1]-airDemand(t.time))*.12*tick);if(v[0]>=30&&v[0]<=80){v[2]+=tick;t.phase=0;}else if(t.phase===0){fail(v[0]>80?'Oxygen enrichment warning. Reduce the valve.':'Low oxygen score. Increase the valve.');t.phase=1;}if(v[2]>=30)finish();}break;
 case 'lights':
  if(is('light')&&valid(3))v[i]=clamp(value);
  if(is('test')){if(v[0]>=50&&v[1]>=30&&v.reduce((a,b)=>a+b,0)<=130)finish();else fail('Supply red and blue light while keeping the total lighting budget at 130 or below.');}break;
 case 'plant':
  if(is('seed')&&valid(3)&&Number.isInteger(value)&&value>=0&&value<=2)v[i]=value;
  if(is('test')){if(new Set(v).size===3&&v.every(x=>x>=0))finish();else fail('Try a varied garden: lettuce, mizuna and one research crop.');}break;
 case 'irrigate':
  if(is('water')&&valid(3))v[i]=clamp(v[i]+clamp(value,-10,10));
  if(is('test')){if(v.every((n,j)=>n>=irrigationBands[j][0]&&n<=irrigationBands[j][1]))finish();else fail('Check each root zone. Too dry and too wet both cause problems.');}break;
 case 'kit':
  if(is('match')&&valid(5)&&!m.includes(i)){if(value===kitTargets[i]){m.push(i);if(m.length===5)finish();}else fail('That tool has another job. Try a different shelf.');}break;
 case 'gravity':
  if(is('sol')){v[0]=clamp(Math.round(value),1,30);if(v[0]===30&&!m.includes(10)){m.push(10);if([0,1,2].every(n=>m.includes(n)))finish();}}
  if(is('zone')&&valid(3)){if(!m.includes(i))m.push(i);t.note=gravityNotes[i];if([0,1,2,10].every(n=>m.includes(n)))finish();else if(m.includes(i)&&!m.includes(10))t.note+=' Now slide to Sol 30 to see the full difference.';}break;
 case 'checkup':
  if(is('scan')&&valid(3)&&!m.includes(i+10)){m.push(i+10);t.note=['Muscle weakness: choose exercise.','Fatigue: choose rest.','Exposure alert: choose shelter to limit further exposure.'][i];}
  if(is('match')&&valid(3)&&!m.includes(i)){if(!m.includes(i+10))fail('Scan this crew member before choosing support.');else if(value===i){m.push(i);if([0,1,2].every(n=>m.includes(n)))finish();}else fail('Match the observed need: exercise, rest or protective shelter.');}break;
 case 'antenna':
  if(is('angle')&&t.phase===0)v[0]=clamp(value,0,90);
  if(is('send')&&t.phase===0){if(Math.abs(v[0]-65)<=5){t.phase=1;v[1]=0;v[2]=clamp(Math.round(value||12),3,22);t.note='Message sent! It travels at the speed of light, but Earth is very far away…';}else fail('Weak signal. Point the antenna towards Earth at 65°.');}
  // Compressed journey: 1 simulated second = 1 real minute of radio travel, out and back, with a short pause on Earth.
  if(tick&&t.phase===1){v[1]+=tick;const before=v[1]-tick,d=v[2];
   if(before<d&&v[1]>=d)t.note='Earth received the message! Mission control is writing a reply…';
   if(before<d+ANTENNA_PAUSE&&v[1]>=d+ANTENNA_PAUSE)t.note='The reply is on its way back to Mars. It needs the same time again.';
   if(before<2*d+ANTENNA_PAUSE&&v[1]>=2*d+ANTENNA_PAUSE)t.note=`Reply received on Mars, ${2*d} minutes after we sent our message!`;
   if(v[1]>=antennaTrip(d))finish();}
  break;
 case 'rock':
  if(is('focus'))v[0]=clamp(value);
  if(is('identify')&&valid(3)){if(Math.abs(v[0]-65)>8)fail('The image is blurred. Adjust focus before recording.');else if(i===t.phase){t.phase++;v[0]=20;if(t.phase===3)finish();}else fail('Look closely at the visible texture. Record what you observe.');}break;
 case 'weather':
  if(is('match')&&valid(4)&&!m.includes(i)){if(value===i){m.push(i);if(m.length===4)finish();}else fail('That socket measures something else. Match the sensor to its quantity.');}break;
 }
 return JSON.stringify(t)===JSON.stringify(current)?current:t;
}
export function applyTraining(s:SurvivalState,id:TaskId,action:TaskAction,now=Date.now()):SurvivalState {
 if(s.status!=='playing'||s.pendingEvent||!taskAvailable(s,id)||!s.buildings.some(b=>b.kind===taskById(id).room))return s;
 const progress=s.commissioning.training,current=progress.tasks[id]??initialTask(id),next=reduceTask(id,current,action);
 if(next===current)return s;
 // Keep the unchanged 3D world stable while a slider or a training timer updates.
 const n:SurvivalState={...s,commissioning:{...s.commissioning,completed:[...s.commissioning.completed],attempts:{...s.commissioning.attempts},training:{...progress,tasks:{...progress.tasks,[id]:next},records:{...progress.records}}}},training=n.commissioning.training;
 const room=taskById(id).room;n.commissioning.attempts[room]=(n.commissioning.attempts[room]??0)+next.mistakes-current.mistakes;
 if(next.done){
  const old=training.records[id],stars=taskStars(next);training.records[id]={stars:Math.max(old?.stars??0,stars) as 1|2|3,mistakes:Math.min(old?.mistakes??Infinity,next.mistakes),credits:old?.credits??((old?.stars??stars)===3?15:10)};
  // First completion only: practice cannot farm credits or send duplicate messages.
  if(!old){training.credits+=stars===3?15:10;n.history=[...s.history,`Training: ${taskById(id).title} — ${stars}/3 stars.`];
   if(id==='antenna'){training.messageSentAt=now;training.messageDueAt=now+s.environment.commDelayMinutes*60_000;training.replyDueAt=now+s.environment.commDelayMinutes*120_000;}
   if(id==='weather'){training.weatherUnlocked=true;if(!n.flags.includes('training-forecast'))n.flags=[...s.flags,'training-forecast'];}
  }
  if(roomTasks(room).every(t=>!!training.records[t.id])&&!n.commissioning.completed.includes(room)){
   n.commissioning.completed.push(room);n.buildings=n.buildings.map(b=>(b.kind===room||(room==='water'&&b.kind==='storage')||(room==='oxygen'&&b.kind==='habitat'))?{...b,active:true}:b);
   n.message=`${room} training complete. Facility online.`;
  }
 }
 return n;
}
export function restartTrainingTask(s:SurvivalState,id:TaskId):SurvivalState {
 if(s.status!=='playing'||s.pendingEvent||!taskAvailable(s,id))return s;
 return {...s,commissioning:{...s.commissioning,training:{...s.commissioning.training,tasks:{...s.commissioning.training.tasks,[id]:initialTask(id)}}}};
}
