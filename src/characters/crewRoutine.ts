import type { CrewMember } from '../simulation/types';
import type { Kind } from '../simulation/engine';
import { doorIsOpen, type Door } from '../explorer/layout';
import { clearSegment, findCrewPath, roomDestination, type CrewNavigation, type CrewBerth, type NavPoint } from './crewNavigation';
// Shared with the 720-sol surface calendar: a full day takes twelve active minutes.
export const HABITAT_DAY_SECONDS=720, DEFAULT_HABITAT_SECONDS=HABITAT_DAY_SECONDS/3;
export const habitatHour=(seconds:number)=>((seconds/HABITAT_DAY_SECONDS*24)%24+24)%24;
export const habitatClock=(seconds:number)=>{const minutes=Math.floor(habitatHour(seconds)*60);return `${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`};
export const nightShift=(seconds:number)=>habitatHour(seconds)>=22||habitatHour(seconds)<6;
export type CrewActivity='walking'|'working'|'returning'|'settling'|'sleeping'|'waking'|'waiting'|'sheltering'|'off-duty';
export interface CrewAgent {id:string;position:NavPoint;heading:number;path:NavPoint[];goal:NavPoint|null;goalKey:string;activity:CrewActivity;destination:string;speed:number;blend:number;wait:number;repath:number;visit:number;berth:CrewBerth|null;restRequested:boolean}
export function createCrewAgent(id:string,position:NavPoint,berth:CrewBerth|null):CrewAgent {return {id,position:{...position},heading:0,path:[],goal:null,goalKey:'',activity:'working',destination:'Crew habitat',speed:0,blend:0,wait:0,repath:0,visit:0,berth,restRequested:false}}
export function restReason(c:CrewMember,seconds:number){return c.assignment==='rest'||c.condition==='Incapacitated'||c.fatigue>=80?'Recovery rest':nightShift(seconds)?'Night rest':habitatHour(seconds)>=21?'Evening return':null}
function workplace(c:CrewMember):Kind {return c.assignment==='greenhouse'?'greenhouse':c.assignment==='medical'?'medical':c.assignment==='research'?'research':c.assignment==='maintenance'?'solar':'habitat'}
const dist=(a:NavPoint,b:NavPoint)=>Math.hypot(a.x-b.x,a.z-b.z);
export function doorOnStep(doors:Door[],a:NavPoint,b:NavPoint,states:Record<string,boolean>){return doors.find(d=>!doorIsOpen(d,states)&&((d.axis==='x'&&Math.min(a.x,b.x)-.45<=d.x&&Math.max(a.x,b.x)+.45>=d.x&&Math.abs(b.z-d.z)<1.6)||(d.axis==='z'&&Math.min(a.z,b.z)-.45<=d.z&&Math.max(a.z,b.z)+.45>=d.z&&Math.abs(b.x-d.x)<1.6)))}
export function stepCrew(agent:CrewAgent,c:CrewMember,nav:CrewNavigation,seconds:number,dt:number,index:number,obstacles:NavPoint[],doors:Record<string,boolean>,shelter=false):string|undefined {
 dt=Math.max(0,Math.min(.1,dt));agent.speed=0;agent.repath=Math.max(0,agent.repath-dt);
 const rest=restReason(c,seconds);agent.restRequested=!!rest;
 const sleepNow=!!rest&&rest!=='Evening return'&&!shelter&&c.assignment!=='shelter';
 let destination:NavPoint,label:string,key:string;
 if((rest||c.assignment==='shelter'||shelter)&&agent.berth){destination=agent.berth.approach;label=shelter||c.assignment==='shelter'?'Habitat shelter':rest==='Evening return'?'Bunk · lights out at 22:00':'Assigned bunk';key=`home:${agent.berth.id}`;}
 else{const kind=workplace(c);const rooms=nav.layout.rooms.filter(r=>r.kind===kind),primary=rooms[index%Math.max(1,rooms.length)]??nav.layout.habitat;
  const visits=[primary,nav.layout.rooms.find(r=>r.kind==='water')??primary,nav.layout.habitat];const room=visits[agent.visit%visits.length];destination=roomDestination(nav,room,index);label=room.name.toLowerCase();key=`work:${room.id}:${agent.visit}`;
 }
 agent.destination=label;
 if(agent.blend>0&&!sleepNow){agent.activity='waking';agent.blend=Math.max(0,agent.blend-dt/1.5);agent.path=[];agent.goalKey='';return;}
 if(sleepNow&&agent.berth&&dist(agent.position,agent.berth.approach)<.08){agent.position={...agent.berth.approach};agent.blend=Math.min(1,agent.blend+dt/1.5);agent.activity=agent.blend===1?'sleeping':'settling';agent.path=[];agent.goalKey=key;return;}
 if(key!==agent.goalKey){agent.goalKey=key;agent.goal=destination;agent.path=findCrewPath(nav,agent.position,destination);agent.wait=0;}
 if(!agent.path.length){
  if(dist(agent.position,destination)<.1){agent.activity=shelter||c.assignment==='shelter'?'sheltering':rest==='Evening return'?'off-duty':'working';agent.wait+=dt;
   if(!rest&&c.assignment!=='shelter'&&!shelter&&agent.wait>18+index*7){agent.visit++;agent.goalKey='';}return;
  }
  agent.activity='waiting';if(agent.repath<=0){agent.path=findCrewPath(nav,agent.position,destination,obstacles);agent.repath=2;}return;
 }
 let waypoint=agent.path[0];if(dist(agent.position,waypoint)<.04){agent.position={...waypoint};agent.path.shift();if(!agent.path.length)return;waypoint=agent.path[0];}
 const length=dist(agent.position,waypoint),speed=c.condition==='Incapacitated'?.5:c.fatigue>=70?.7:1.15,amount=Math.min(length,speed*dt),next={x:agent.position.x+(waypoint.x-agent.position.x)/length*amount,z:agent.position.z+(waypoint.z-agent.position.z)/length*amount};
 const door=doorOnStep(nav.layout.doors,agent.position,next,doors);
 if(door){agent.activity='waiting';if(!door.airlock)return door.id;return;}
 if(obstacles.some(p=>dist(next,p)<.8&&dist(next,p)<dist(agent.position,p))){agent.activity='waiting';if(agent.repath<=0){const alternate=findCrewPath(nav,agent.position,destination,obstacles);if(alternate.length)agent.path=alternate;agent.repath=1.5;}return;}
 if(!clearSegment(nav,agent.position,next)){agent.path=[];agent.goalKey='';agent.activity='waiting';return;}
 agent.heading=Math.atan2(next.x-agent.position.x,next.z-agent.position.z);agent.position=next;agent.speed=speed;agent.activity=rest?'returning':'walking';
}
export const activityLabel=(agent:Pick<CrewAgent,'activity'|'destination'>)=>agent.activity==='sleeping'?'Sleeping':agent.activity==='settling'?'Getting into bunk':agent.activity==='waking'?'Waking up':agent.activity==='returning'?'Returning to bunk':agent.activity==='walking'?`Walking to ${agent.destination}`:agent.activity==='waiting'?'Giving way / waiting':agent.activity==='sheltering'?'In habitat shelter':agent.activity==='off-duty'?'Ready for lights out':`Working · ${agent.destination}`;
