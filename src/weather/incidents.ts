import { dependencies,roomTasks,taskById,type TaskId,type TrainingRoom } from '../training/catalog';
import type { TaskState } from '../training/engine';
import type { SurvivalState } from '../simulation/types';
import { WEATHER_SOURCES } from './calendar';
import { failedLessonRoots } from '../training/attempts';

/** Fictional maintenance scenarios, inspired by the archived weather chronology.
 * Neither damaged hardware nor these repair procedures were measured by MEDA.
 */
export const SURFACE_INCIDENTS=[
 {id:'ice-clouds',sol:284,endSol:305,task:'lights',title:'Grow lights: reduced solar power',problem:'Ice clouds reduce the light reaching the exterior solar arrays. The base pauses the greenhouse for an energy-efficient LED check.',repair:'Recalibrate red and blue grow lights within the power budget, then test the leaves.',source:'chronology'},
 {id:'regional-dust',sol:313,endSol:318,task:'dust',title:'Solar arrays covered in dust',problem:'The storm has coated the fictional base’s arrays. Power-dependent experiments are temporarily suspended.',repair:'Clean every solar cell and clear the dust returned by the gust.',source:'storm'},
 {id:'dust-c-arrival',sol:571,endSol:574,task:'dust',title:'Dust storm C: arrays need cleaning',problem:'A new storm has covered the arrays again. Restore the first Energy step to release its dependent systems.',repair:'Clean the solar arrays again; your earlier stars stay saved.',source:'chronology'},
 {id:'dust-c-peak',sol:574,endSol:574,task:'battery',title:'Emergency battery bus isolated',problem:'At the storm peak, the fictional base isolates its battery distribution bus for a backup-power check.',repair:'Reconnect all five battery circuits and verify the closed paths.',source:'chronology'},
 {id:'persistent-dust',sol:600,endSol:640,task:'filter',title:'Water-processing filter inspection',problem:'Persistent dust triggers a precautionary inspection of the external sample-processing filter. Water-dependent experiments wait for validation.',repair:'Rebuild the coarse-to-fine filter, run the sample and test conductivity.',source:'chronology'},
 {id:'pressure-tides',sol:703,endSol:703,task:'weather',title:'Weather-station validation required',problem:'The unexpected atmospheric pressure cycle requires a sensor check before the laboratory accepts new weather data. A sensor failure is not assumed.',repair:'Revalidate the four weather-station sensor connections.',source:'chronology'},
] as const satisfies readonly {id:string;sol:number;endSol:number;task:TaskId;title:string;problem:string;repair:string;source:keyof typeof WEATHER_SOURCES}[];
export type SurfaceIncidentId=typeof SURFACE_INCIDENTS[number]['id'];
export interface SurfaceIncidentProgress {throughSol:number;triggered:SurfaceIncidentId[];active:SurfaceIncidentId[];repairs:Partial<Record<TaskId,TaskState>>}
export const freshSurfaceIncidents=():SurfaceIncidentProgress=>({throughSol:1,triggered:[],active:[],repairs:{}});
type State=Pick<SurvivalState,'commissioning'>;
export const surfaceIncident=(id:SurfaceIncidentId)=>SURFACE_INCIDENTS.find(e=>e.id===id)!;
export const activeSurfaceIncidents=(s:State)=>(s.commissioning.training.incidents?.active??[]).map(surfaceIncident).filter(Boolean);
export const hasSurfaceIncidents=(s:State)=>activeSurfaceIncidents(s).length>0;
export const hasSystemLocks=(s:State)=>hasSurfaceIncidents(s)||failedLessonRoots(s).length>0;
export function taskDependsOn(id:TaskId,root:TaskId,seen=new Set<TaskId>()):boolean {
 if(id===root)return true;if(seen.has(id))return false;seen.add(id);
 const task=taskById(id),list=roomTasks(task.room),index=list.findIndex(t=>t.id===id);
 const prerequisites:TaskId[]=[...(index>0?[list[index-1].id]:[]),...dependencies[task.room].map(room=>roomTasks(room).at(-1)!.id)];
 return prerequisites.some(previous=>taskDependsOn(previous,root,seen));
}
export const blockingSurfaceIncidents=(s:State,id:TaskId)=>activeSurfaceIncidents(s).filter(e=>taskDependsOn(id,e.task));
export const taskSuspended=(s:State,id:TaskId)=>blockingSurfaceIncidents(s,id).length>0||failedLessonRoots(s).some(root=>taskDependsOn(id,root));
export const roomSuspended=(s:State,room:TrainingRoom)=>roomTasks(room).some(t=>taskSuspended(s,t.id));
export const taskOperational=(s:State,id:TaskId)=>!!s.commissioning.training.records[id]&&!taskSuspended(s,id);
