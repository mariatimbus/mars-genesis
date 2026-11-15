import { useCallback,useEffect,useMemo,useState } from 'react';
import { LockKeyhole,Wrench,RotateCcw,Siren } from 'lucide-react';
import { useGame } from '../store/game';
import { taskById,roomNames,type TaskId } from '../training/catalog';
import { initialTask,type TaskAction } from '../training/engine';
import { TaskStage } from '../training/TaskStage';
import { PlayExtra } from '../training/stages/common';
import { briefings } from '../training/briefings';
import { useTrainingUI } from '../training/ui';
import { activeSurfaceIncidents,followupReason,incidentTasks,pendingIncidentTasks,blockingSurfaceIncidents,incidentSeverity,type SurfaceIncidentId } from './incidents';
import { WEATHER_SOURCES } from './calendar';
import './incidents.css';
import { attemptFor,failedLessonRoots,retryRemaining } from '../training/attempts';
import { AttemptFailure,AttemptRules,AttemptStatus } from '../training/AttemptPanel';

export function SurfaceIncidentNotice(){
 const g=useGame(),incidents=activeSurfaceIncidents(g);
 const failures=failedLessonRoots(g);if(!incidents.length&&!failures.length)return null;
 const roots=[...new Set(incidents.flatMap(e=>incidentTasks(g,e)))];
 const pendingCount=new Set(incidents.flatMap(event=>pendingIncidentTasks(g,event))).size;
 const severity=incidents.some(e=>incidentSeverity(g,e.id)==='critical')?'critical':'warning';
 const title=severity==='warning'?'BASE WARNING · SYSTEMS AFFECTED':'BASE ALERT · SYSTEMS ISOLATED';
 return <section className={`surface-incident-notice ${incidents.length?`is-base-alert is-${severity}`:''}`} aria-label="System maintenance locks"><strong>{incidents.length?<Siren size={18}/>:<LockKeyhole size={14}/>} {incidents.length?`${title} · `:''}{pendingCount+failures.length} MAINTENANCE LOCK{pendingCount+failures.length>1?'S':''}</strong>{roots.map(task=>{
  const event=incidents.find(e=>incidentTasks(g,e).includes(task))!,t=taskById(task);
  const taskSeverity=incidentSeverity(g,event.id),done=!!g.commissioning.training.incidents?.repairs[task]?.done;
  return <div key={task} className={`is-${taskSeverity}`}><span>{task===event.task?event.title:`Required follow-up · ${t.title}`}{g.commissioning.training.incidents?.repairs[task]?.done?' ✓':''}</span><small>{roomNames[t.room]} · {t.title} · {done?'verified · waiting for connected checks':taskSeverity==='warning'?'warning — turns critical in 2 sols':'critical'}</small><button onClick={()=>useTrainingUI.getState().repair(task)}><Wrench size={13}/> {done?'View completed check':'Restore this step'}</button></div>;
 })}{failures.map(task=><div key={`failed-${task}`}><span className="failed-challenge-label">Attempt failed · {taskById(task).title}</span><small>{retryRemaining(g,task)>0?`${Math.ceil(retryRemaining(g,task))} active seconds until retry`:'Retry available · system still isolated'}</small><button onClick={()=>useTrainingUI.getState().repair(task)}>Open failed challenge</button></div>)}<p>Dependent steps are paused. Your stars and discoveries are saved.</p></section>;
}
export function IncidentLock({task}:{task:Parameters<typeof blockingSurfaceIncidents>[1]}){
 const g=useGame(),event=blockingSurfaceIncidents(g,task)[0];if(!event)return null;
 return <div className="training-locked surface-task-lock"><LockKeyhole size={30}/><h3>Temporarily paused by a surface event</h3><p>{event.title} · Surface sol {event.sol}</p><p>Restore <b>{taskById(event.task).title}</b> to release this dependency. Earlier completion and stars are saved.</p><button onClick={()=>useTrainingUI.getState().repair(event.task)}><Wrench size={15}/> Go to the repair</button></div>;
}
export function IncidentRepair({id,task:target}:{id:SurfaceIncidentId;task?:TaskId}){
 const g=useGame(),event=activeSurfaceIncidents(g).find(e=>e.id===id),[started,setStarted]=useState(false),[running,setRunning]=useState(false);
 const task=target??event?.task??'dust',progress=g.commissioning.training.incidents;
 const t=useMemo(()=>progress?.repairs[task]??initialTask(task),[progress?.repairs,task]);
 const run=attemptFor(g,task,'repair');
 const act=useCallback((action:TaskAction)=>useGame.getState().surfaceRepairAction(id,action,task),[id,task]);
 useEffect(()=>{
  if(!started||!running||t.done||run?.status==='failed'||g.status!=='playing')return;
  let last=performance.now();const timer=setInterval(()=>{const now=performance.now(),dt=Math.min(.5,(now-last)/1000);last=now;if(!document.hidden)act({type:'tick',value:dt})},250);
  return()=>clearInterval(timer);
 },[started,running,t.done,g.status,act,run?.status]);
 useEffect(()=>{const pause=()=>setRunning(false);window.addEventListener('blur',pause);document.addEventListener('visibilitychange',pause);return()=>{window.removeEventListener('blur',pause);document.removeEventListener('visibilitychange',pause)}},[]);
 if(!event)return null;
 if(t.done)return <div className="training-result" role="status"><h3>Verification complete</h3><p>This step is safe. Finish the remaining mandatory check before the connected rooms can restart.</p>{pendingIncidentTasks(g,event).map(next=><button key={next} onClick={()=>useTrainingUI.getState().repair(next)}>Continue: {roomNames[taskById(next).room]} · {taskById(next).title}</button>)}</div>;
 const followup=task!==event.task;
 const source=WEATHER_SOURCES[event.source];
 const extra=<div className="play-extra"><div className="training-feedback" role="status">{t.note||event.repair}</div><details className="play-rules"><summary>Repair instructions</summary><ol>{briefings[task].rules.map(rule=><li key={rule}>{rule}</li>)}</ol></details><button className="training-reset" onClick={()=>{setRunning(false);act({type:'restart'})}}><RotateCcw size={13}/> Restart repair</button></div>;
 return <section className={`surface-repair ${started&&run?.status!=='failed'?'is-playing':''}`}>{!started&&run?.status!=='failed'&&<div className="surface-repair-brief"><span><LockKeyhole size={14}/> MAINTENANCE LOCK · SURFACE SOL {event.sol}</span><h3>{followup?`Follow-up verification · ${taskById(task).title}`:event.title}</h3><p>{followup?followupReason[event.id]:event.problem}</p><p><b>Repair:</b> {followup?briefings[task].rules.join(' '):event.repair}</p><small>Emergency maintenance bench · independent training supplies · no repeat rewards. All mandatory checks must pass before dependent systems restart.</small><details><summary>Real observation / game scenario</summary><p>The weather chronology is archived. This hardware interruption and its repair are fictional gameplay scenarios. Clearing a panel does not remove airborne dust or the clouds.</p><a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a></details></div>}
 <AttemptStatus id={task} mode="repair"/>{run?.status==='failed'?<AttemptFailure id={task} mode="repair" onRetry={()=>{act({type:'begin-attempt'});setStarted(true);setRunning(false)}}/>:!started?<><AttemptRules id={task} mode="repair"/><button className="surface-start-repair" disabled={g.status!=='playing'} onClick={()=>{act({type:'begin-attempt'});setStarted(true)}}><Wrench size={16}/> {run?.status==='running'?'Resume timed repair':'Start hard repair'}: {taskById(task).title}</button></>:<fieldset className="training-stage" disabled={g.status!=='playing'}><PlayExtra.Provider value={extra}><TaskStage id={task} t={t} act={act} running={running} setRunning={setRunning}/></PlayExtra.Provider></fieldset>}
 </section>;
}
