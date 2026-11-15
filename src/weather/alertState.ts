import type { Kind } from '../simulation/engine';
import type { SurvivalState } from '../simulation/types';
import { roomTasks,taskById,tasks,type TaskId } from '../training/catalog';
import { failedLessonRoots } from '../training/attempts';
import { activeSurfaceIncidents,incidentTasks,incidentSeverity,overallAlertSeverity,taskDependsOn } from './incidents';

type State=Pick<SurvivalState,'commissioning'> & {sol?:number};
/** The alarm follows unresolved environmental incidents, not weather previews or
 * the current day's sky. A failed retry cannot silence an unresolved incident. */
export function baseAlertState(s:State){
 const incidents=activeSurfaceIncidents(s);
 const roots=tasks.filter(t=>incidents.some(e=>incidentTasks(s,e).includes(t.id))).map(t=>t.id);
 const severity=overallAlertSeverity(s);
 return {active:roots.length>0,roots,incidents,severity};
}
export interface RoomMaintenance {blocked:boolean;direct:boolean;repairTask?:TaskId}
/** Mirrors facility suspension, including water-dependent storage. Emergency
 * habitat circulation remains available and is never marked as a failed room. */
export function roomMaintenance(s:State,kind:Kind):RoomMaintenance {
 if(kind==='habitat')return {blocked:false,direct:false};
 const room=kind==='storage'?'water':kind;
 const roots=new Set([...baseAlertState(s).roots,...failedLessonRoots(s)]);
 const relevant=tasks.filter(t=>roots.has(t.id)&&roomTasks(room).some(step=>taskDependsOn(step.id,t.id)));
 const direct=relevant.find(t=>taskById(t.id).room===kind);
 const repairTask=(direct??relevant[0])?.id;
 return {blocked:repairTask!==undefined,direct:!!direct,repairTask};
}
/** One slow red pulse every two seconds. Reduced motion keeps a steady beacon. */
export const alertPulse=(seconds:number,reducedMotion=false)=>reducedMotion?1:.25+.75*(.5-.5*Math.cos(seconds*Math.PI));
