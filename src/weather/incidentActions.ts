import type { SurvivalState } from '../simulation/types';
import { taskById } from '../training/catalog';
import { initialTask,reduceTask,type TaskAction } from '../training/engine';
import { SURFACE_INCIDENTS,freshSurfaceIncidents,activeSurfaceIncidents,hasSurfaceIncidents,type SurfaceIncidentId } from './incidents';
import { clampSol } from './calendar';
import { attemptFor,retryRemaining,freshAttempt,withAttempt,failAttempt,fatalAttemptAction } from '../training/attempts';

export function enterSurfaceSol(s:SurvivalState,sol:number,replayScenario=false):SurvivalState {
 if(!Number.isFinite(sol)||s.status!=='playing')return s;
 const p=s.commissioning.training.incidents??freshSurfaceIncidents(),day=clampSol(sol);
 if(day<=p.throughSol&&!replayScenario)return s;
 const due=SURFACE_INCIDENTS.filter(e=>e.sol>p.throughSol&&e.sol<=day&&!p.triggered.includes(e.id)||replayScenario&&e.sol<=day&&day<=e.endSol&&!p.active.includes(e.id));
 if(!due.length&&day<=p.throughSol)return s;
 const repairs={...p.repairs};
 const runs=s.commissioning.training.runs;
 const repairRuns={...runs?.repair};
 for(const e of due)if(!activeSurfaceIncidents(s).some(a=>a.task===e.task)){repairs[e.task]=initialTask(e.task,true);delete repairRuns[e.task];}
 const incidents={throughSol:Math.max(day,p.throughSol),triggered:[...new Set([...p.triggered,...due.map(e=>e.id)])],active:[...new Set([...p.active,...due.map(e=>e.id)])],repairs};
 return {...s,commissioning:{...s.commissioning,training:{...s.commissioning.training,incidents,...(runs?{runs:{...runs,repair:repairRuns}}:{})}},
  ...(due.length?{message:`Surface incident: ${due[0].title}. Repair the affected experiment.`,notifications:[...s.notifications,...due.map(e=>`Surface sol ${e.sol}: ${e.title}. Maintenance lock active.`)],history:[...s.history,...due.map(e=>`Surface sol ${e.sol}: ${e.title} (fictional maintenance scenario).`)]}:{}),
 };
}
export function repairSurfaceIncident(s:SurvivalState,id:SurfaceIncidentId,action:TaskAction):SurvivalState {
 const incident=activeSurfaceIncidents(s).find(e=>e.id===id);if(!incident||s.status!=='playing')return s;
 const previous=attemptFor(s,incident.task,'repair');if(retryRemaining(s,incident.task,'repair')>0)return s;
 if(action.type==='begin-attempt'){
  if(previous?.status==='running')return s;
  const n=withAttempt(s,incident.task,'repair',freshAttempt(previous));
  return {...n,commissioning:{...n.commissioning,training:{...n.commissioning.training,incidents:{...n.commissioning.training.incidents!,repairs:{...n.commissioning.training.incidents!.repairs,[incident.task]:initialTask(incident.task,true)}}}}};
 }
 if(previous?.status==='failed')return s;
 const p=s.commissioning.training.incidents!,current=p.repairs[incident.task]??initialTask(incident.task,true);
 const next=action.type==='restart'?initialTask(incident.task,true):reduceTask(incident.task,current,action);
 if(next===current)return s;
 // The emergency bench is usable without the disabled production chain. It
 // consumes training supplies, preserves achievements and awards no credits.
 const run=previous?.status==='running'?previous:freshAttempt(previous),failed=fatalAttemptAction(incident.task,current,next,action);
 const resolved=next.done&&!failed?activeSurfaceIncidents(s).filter(e=>e.task===incident.task):[];
 const incidents={...p,active:p.active.filter(key=>!resolved.some(e=>e.id===key)),repairs:{...p.repairs,[incident.task]:next}};
 let n=withAttempt({...s,commissioning:{...s.commissioning,training:{...s.commissioning.training,incidents}}},incident.task,'repair',next.done?{...run,status:'succeeded'}:run);
 if(failed)return failAttempt(n,incident.task,'repair',run,undefined,{kind:'operation',action:{...action},note:next.mistakes>current.mistakes?next.note:undefined});
 if(resolved.length){
  const taskTitle=taskById(incident.task).title;
  const remaining=activeSurfaceIncidents(n).length;
  n.message=resolved.length===1
   ?(remaining?`Repair verified: ${resolved[0].title}. ${remaining} maintenance lock${remaining>1?'s':''} remain.`:`Repair verified: ${resolved[0].title}. Dependent systems restored.`)
   :(remaining?`Repair verified: ${resolved.length} ${taskTitle} incidents resolved. ${remaining} maintenance lock${remaining>1?'s':''} remain.`:`Repair verified: ${resolved.length} ${taskTitle} incidents resolved. All dependent systems restored.`);
  n.notifications=[...s.notifications,n.message];
  n.history=[...s.history,...resolved.map(e=>`Surface repair complete: ${e.title}.`)];
 }
 return n;
}
