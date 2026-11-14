import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_HABITAT_SECONDS, HABITAT_DAY_SECONDS, type CrewActivity } from './crewRoutine';
import type { NavPoint } from './crewNavigation';
export interface CrewPresence extends NavPoint {activity:CrewActivity;destination:string;heading:number;blend:number;berthId:string|null}
interface CrewLife {seconds:number;revision:number;members:Record<string,CrewPresence>;setTime:(hour:number)=>void;publish:(seconds:number,members:Record<string,CrewPresence>)=>void}
export const useCrewLife=create<CrewLife>()(persist(set=>({seconds:DEFAULT_HABITAT_SECONDS,revision:0,members:{},
 setTime:hour=>{if(!Number.isFinite(hour))return;set(s=>({seconds:((hour%24)+24)%24/24*HABITAT_DAY_SECONDS,revision:s.revision+1}))},
 publish:(seconds,members)=>set({seconds,members}),
}),{name:'ares-one-crew-routine',version:1,partialize:s=>({seconds:s.seconds,members:s.members}),merge:(saved,current)=>{const s=saved as Partial<CrewLife>;return {...current,seconds:Number.isFinite(s.seconds)?s.seconds!:DEFAULT_HABITAT_SECONDS,members:s.members??{}}}}));
