import type { SurvivalState } from '../simulation/types';
import { taskById,type TaskId } from '../training/catalog';
import { initialTask,reduceTask,type TaskAction } from '../training/engine';
import { SURFACE_INCIDENTS,freshSurfaceIncidents,activeSurfaceIncidents,hasSurfaceIncidents,incidentTasks,pendingIncidentTasks,followupTask,type SurfaceIncidentId } from './incidents';
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
 for(const e of due)if(!activeSurfaceIncidents(s).some(a=>pendingIncidentTasks(s,a).includes(e.task))){repairs[e.task]=initialTask(e.task,true);delete repairRuns[e.task];}
 const incidents={...p,briefed:(p.briefed??[]).filter(id=>!due.some(e=>e.id===id)),deferred:Object.fromEntries(Object.entries(p.deferred??{}).filter(([id])=>!due.some(e=>e.id===id))),throughSol:Math.max(day,p.throughSol),triggered:[...new Set([...p.triggered,...due.map(e=>e.id)])],active:[...new Set([...p.active,...due.map(e=>e.id)])],repairs};
 return {...s,commissioning:{...s.commissioning,training:{...s.commissioning.training,incidents,...(runs?{runs:{...runs,repair:repairRuns}}:{})}},
  ...(due.length?{message:`Surface incident: ${due[0].title}. Repair the affected experiment.`,notifications:[...s.notifications,...due.map(e=>`Surface sol ${e.sol}: ${e.title}. Maintenance lock active.`)],history:[...s.history,...due.map(e=>`Surface sol ${e.sol}: ${e.title} (fictional maintenance scenario).`)]}:{}),
 };
}
export function repairSurfaceIncident(s:SurvivalState,id:SurfaceIncidentId,action:TaskAction,target?:TaskId):SurvivalState {
 const incident=activeSurfaceIncidents(s).find(e=>e.id===id);if(!incident||s.status!=='playing')return s;
 const task=target??incident.task;if(!incidentTasks(s,incident).includes(task))return s;
 const previous=attemptFor(s,task,'repair');if(retryRemaining(s,task,'repair')>0)return s;
 if(action.type==='begin-attempt'){
  if(previous?.status==='running'||s.commissioning.training.incidents?.repairs[task]?.done)return s;
  const n=withAttempt(s,task,'repair',freshAttempt(previous));
  return {...n,commissioning:{...n.commissioning,training:{...n.commissioning.training,incidents:{...n.commissioning.training.incidents!,repairs:{...n.commissioning.training.incidents!.repairs,[task]:initialTask(task,true)}}}}};
 }
 if(previous?.status==='failed'||s.commissioning.training.incidents?.repairs[task]?.done)return s;
 const p=s.commissioning.training.incidents!,current=p.repairs[task]??initialTask(task,true);
 const next=action.type==='restart'?initialTask(task,true):reduceTask(task,current,action);
 if(next===current)return s;
 // The emergency bench is usable without the disabled production chain. It
 // consumes training supplies, preserves achievements and awards no credits.
 const run=previous?.status==='running'?previous:freshAttempt(previous),failed=fatalAttemptAction(task,current,next,action);
 const repairedState={...s,commissioning:{...s.commissioning,training:{...s.commissioning.training,incidents:{...p,repairs:{...p.repairs,[task]:next}}}}};
 const resolved=next.done&&!failed?activeSurfaceIncidents(s).filter(e=>!pendingIncidentTasks(repairedState,e).length):[];
 const incidents={...p,active:p.active.filter(key=>!resolved.some(e=>e.id===key)),repairs:{...p.repairs,[task]:next}};
 let n=withAttempt({...s,commissioning:{...s.commissioning,training:{...s.commissioning.training,incidents}}},task,'repair',next.done?{...run,status:'succeeded'}:run);
 if(failed)return failAttempt(n,task,'repair',run,undefined,{kind:'operation',action:{...action},note:next.mistakes>current.mistakes?next.note:undefined});
 if(resolved.length){
  const taskTitle=taskById(task).title;
  const remaining=activeSurfaceIncidents(n).length;
  n.message=resolved.length===1
   ?(remaining?`Repair verified: ${resolved[0].title}. ${remaining} maintenance lock${remaining>1?'s':''} remain.`:`Repair verified: ${resolved[0].title}. Dependent systems restored.`)
   :(remaining?`Repair verified: ${resolved.length} ${taskTitle} incidents resolved. ${remaining} maintenance lock${remaining>1?'s':''} remain.`:`Repair verified: ${resolved.length} ${taskTitle} incidents resolved. All dependent systems restored.`);
  n.notifications=[...s.notifications,n.message];
  n.history=[...s.history,...resolved.map(e=>`Surface repair complete: ${e.title}.`)];
 }
 return n;
}

/** Acknowledging is durable; repeated Later clicks never reset a board or add more work. */
export function acknowledgeSurfaceIncident(s:SurvivalState,id:SurfaceIncidentId,later=false):SurvivalState {
 const event=activeSurfaceIncidents(s).find(e=>e.id===id);if(!event||s.status!=='playing')return s;
 const p=s.commissioning.training.incidents!,task=followupTask[id];
 const add=later&&!p.deferred?.[id];
 const alreadyNeeded=activeSurfaceIncidents(s).some(e=>pendingIncidentTasks(s,e).includes(task));
 const reset=add&&!alreadyNeeded;
 const incidents={...p,briefed:[...new Set([...(p.briefed??[]),id])],deferred:{...p.deferred,...(add?{[id]:task}:{})},repairs:{...p.repairs,...(reset?{[task]:initialTask(task,true)}:{})}};
 const runs=s.commissioning.training.runs;
 const repair={...runs?.repair};if(reset)delete repair[task];
 return {...s,commissioning:{...s.commissioning,training:{...s.commissioning.training,incidents,...(runs?{runs:{...runs,repair}}:{})}},...(add?{message:`Repair deferred: also verify ${taskById(task).title} in ${taskById(task).room}. Both checks are mandatory.`,history:[...s.history,`Deferred ${event.title}: additional ${taskById(task).title} verification required.`]}:{})};
}
