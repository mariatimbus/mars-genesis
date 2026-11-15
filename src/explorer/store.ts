import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useGame } from '../store/game';
import type { Point, Layout, Door } from './layout';
import { inAirlock, doorIsOpen } from './layout';
import { EVA_LIMIT_SECONDS } from './survival';
import { exteriorPlan } from './exteriorPlan';
import { meshGroundHeight } from './fixtures';
import { ownedPlots } from '../game/worldConfig';
import type { RoverState } from './roverPhysics';
export type Interaction={type:'door'|'suit'|'cycle'|'relay'|'terminal'|'crew'|'storage'|'rover';id:string;label:string};
export type ExplorerPanel={type:'tablet'|'terminal'|'repair'|'crew';id?:string}|null;
interface Explorer {
 rovers:RoverState[];activeRover:string|null;exitRequested:boolean;waypoint:string;visited:string[];locationSaved:boolean;relocation:number;
 initRovers:(l:Layout)=>void;boardRover:(id:string,deploy?:boolean)=>boolean;returnToBase:(l:Layout)=>void;

 heading:number;mapExpanded:boolean;ready:boolean;mode:'first-person'|'overview';locked:boolean;panel:ExplorerPanel;target:Interaction|null;position:Point;playerId:string;
 suited:boolean;oxygen:number;evaSeconds:number;doors:Record<string,boolean>;pressure:number;cycle:number;cycleTarget:number;notice:string;
 modeTo:(v:Explorer['mode'])=>void;setLocked:(v:boolean)=>void;open:(p:ExplorerPanel)=>void;
 door:(d:Door)=>void;cycleAirlock:(l:Layout)=>void;suit:()=>void;tick:(dt:number,outside:boolean,sprinting:boolean)=>void;notify:(text:string)=>void;refill:()=>void;
}
export const useExplorer=create<Explorer>()(persist((set,get)=>({
 rovers:[],activeRover:null,exitRequested:false,waypoint:'base',visited:[],locationSaved:false,relocation:0,heading:0,mapExpanded:false,ready:false,mode:'first-person',locked:false,panel:null,target:null,position:[-3,1.35,28],playerId:'crew-0',suited:false,oxygen:100,evaSeconds:0,doors:{},pressure:1,cycle:0,cycleTarget:1,notice:'',
 initRovers:l=>{if(get().rovers.length)return;const g=useGame.getState(),site=exteriorPlan(l,g.buildings).sites.find(s=>s.kind==='landing');if(!site)return;const plots=ownedPlots(g.expandedPlots);set({rovers:[[-2.5,0],[3,1]].map(([dx,dz],i)=>({id:`rover-${i}`,name:i?'Pathfinder':'Nomad',position:[site.x+dx,meshGroundHeight(l,site.x+dx,site.z+dz,plots)+1.08,site.z+dz] as Point,heading:Math.PI,battery:100,speed:0,odometer:0}))});},
 boardRover:(id,deploy=false)=>{const s=get(),r=s.rovers.find(r=>r.id===id),crew=useGame.getState().astronauts.find(c=>c.id===s.playerId);if(!r||!crew?.alive)return false;
  if(!deploy&&Math.hypot(s.position[0]-r.position[0],s.position[2]-r.position[2])>5){set({notice:'Move closer to the rover door.'});return false;}
  let oxygen=s.oxygen;if(deploy&&useGame.getState().refillSuit(100-s.oxygen))oxygen=100;
  set({activeRover:id,position:r.position,heading:r.heading,exitRequested:false,target:null,notice:'Rover cabin sealed · WASD drive · Shift boost · Space brake · E exit',suited:deploy?true:s.suited,oxygen,locationSaved:true,relocation:s.relocation+1});return true;
 },
 returnToBase:l=>{document.exitPointerLock?.();set(s=>({position:l.spawn,heading:Math.PI,activeRover:null,exitRequested:false,locked:false,panel:null,doors:{},pressure:1,cycle:0,locationSaved:true,relocation:s.relocation+1,notice:'Returned to the habitat. Parked rovers keep their locations.'}));},
 modeTo:mode=>{document.exitPointerLock?.();set({mode,locked:false,panel:null,target:null,doors:{},pressure:1,cycle:0});},
 setLocked:locked=>set({locked,target:locked?get().target:null}),
 open:panel=>{document.exitPointerLock?.();set({panel,locked:false,target:null});},notify:notice=>set({notice}),
 door:d=>{const s=get(),opening=!doorIsOpen(d,s.doors);if(Math.hypot(s.position[0]-d.x,s.position[2]-d.z)>4)return;
  if(!opening&&Math.hypot(s.position[0]-d.x,s.position[2]-d.z)<1.2){set({notice:'Step clear before closing the door.'});return;}
  if(d.airlock&&opening){const other=d.airlock==='inner'?'airlock-outer':'airlock-inner';if(s.doors[other]||s.cycle>0){set({notice:'Interlock: close the other door and finish the pressure cycle.'});return;}
   if(d.airlock==='outer'&&(!s.suited||s.oxygen<=5||s.pressure>.01)){set({notice:'Equip your suit, close the inner door, then depressurize.'});return;}
   if(d.airlock==='inner'&&s.pressure<.99){set({notice:'Pressurize the chamber before opening the inner door.'});return;}}
  set({doors:{...s.doors,[d.id]:opening},notice:''});},
 cycleAirlock:l=>{const s=get();if(!inAirlock(l,s.position)){set({notice:'Enter the airlock to use the pressure panel.'});return;}if(s.doors['airlock-inner']||s.doors['airlock-outer']||s.cycle>0){set({notice:'Close both airlock doors first.'});return;}if(s.pressure>.5&&!s.suited){set({notice:'A spacesuit is required to depressurize.'});return;}if(s.pressure<.5&&!useGame.getState().pressurize()){set({notice:'Need 0.05 kg oxygen and 0.2 kWh to pressurize.'});return;}set({cycle:3,cycleTarget:s.pressure>.5?0:1,notice:'Pressure cycle: 3 seconds.'});},
 suit:()=>set(s=>({suited:!s.suited,notice:s.suited?'Suit stowed.':'Suit equipped. Check oxygen before EVA.'})),
 refill:()=>{const s=get();if(useGame.getState().refillSuit(100-s.oxygen))set({oxygen:100,evaSeconds:0,notice:'Suit refilled from colony oxygen.'});else set({notice:'Not enough stored oxygen to refill.'});},
 tick:(dt,outside,sprinting)=>set(s=>{const elapsed=Math.min(.1,Math.max(0,dt));return {cycle:Math.max(0,s.cycle-elapsed),pressure:s.cycle>0&&s.cycle<=elapsed?s.cycleTarget:s.pressure,oxygen:outside&&!s.activeRover&&s.suited?Math.max(0,s.oxygen-elapsed*100/EVA_LIMIT_SECONDS*(sprinting?1.5:1)):s.oxygen,evaSeconds:outside&&!s.activeRover?s.evaSeconds+elapsed:s.evaSeconds};}),
}),{name:'mars-genesis-explorer',version:2,migrate:(saved)=>saved as Explorer,partialize:s=>({mode:s.mode,suited:s.suited,oxygen:s.oxygen,evaSeconds:s.evaSeconds,playerId:s.playerId,position:s.position,heading:s.heading,locationSaved:s.locationSaved,rovers:s.rovers,activeRover:s.activeRover,waypoint:s.waypoint,visited:s.visited}),merge:(saved,current)=>{const data=saved as Partial<Explorer>,valid=(p:unknown):p is Point=>Array.isArray(p)&&p.length===3&&p.every(n=>typeof n==='number'&&Number.isFinite(n));const rovers=(data.rovers??[]).filter(r=>valid(r.position)&&Number.isFinite(r.heading)&&Number.isFinite(r.battery)).map(r=>({...r,speed:0}));return {...current,...data,rovers,position:valid(data.position)?data.position:current.position,activeRover:rovers.some(r=>r.id===data.activeRover)?(data.activeRover??null):null,locked:false,panel:null,doors:{},pressure:1,cycle:0}}}));
