import { Clock,LockKeyhole } from 'lucide-react';
import { useGame } from '../store/game';
import { taskById,type TaskId } from './catalog';
import { useTrainingUI } from './ui';
import { CHALLENGE_RULES,attemptFor,retryRemaining,deadlineFor,cooldownLabel,failedLessonRoots,type AttemptMode } from './attempts';
import { taskDependsOn,blockingSurfaceIncidents } from '../weather/incidents';
import { initialTask,type TaskState } from './engine';
import { failureReview } from './failureReview';
import './attempts.css';

export function AttemptRules({id,mode='lesson'}:{id:TaskId;mode?:AttemptMode}){
 const rule=CHALLENGE_RULES[id],deadline=deadlineFor(id,mode);
 const hardTargets:Partial<Record<TaskId,string>>={dust:'Three dust layers and two returning storm gusts.',battery:'All five circuits must be connected; the deadline is reduced from 60 to 45 seconds.',filter:'Two fresh filter trains and two verified samples.',lights:'Red 58–68, blue 36–46, green 8–18; total at most 115.',weather:'Connect four sensors, then complete four independent calibration checks.'};
 if(!rule)return <p className="attempt-rules is-learning">Guided learning · feedback and practice, without a failure lock.</p>;
 return <aside className="attempt-rules"><strong>{mode==='repair'?'HARD REPAIR · CONSEQUENCES':'OPERATIONAL CHALLENGE · CONSEQUENCES'}</strong>{mode==='repair'&&<p>{hardTargets[id]}</p>}<p>{deadline?`Finish within ${deadline} seconds of active play. `:''}{rule.fatal.length?'A wrong committed check or unsafe operation ends the attempt. ':''}Failure isolates this step and its dependents. Retry after <b>1 game hour = 30 seconds of active play</b>.</p><small>{rule.consequence} Timers keep running if you reset the board, pause a mechanism or switch challenges. Esc to the base pause screen, background tabs and leaving the app pause active-play time.</small></aside>;
}
export function AttemptStatus({id,mode='lesson'}:{id:TaskId;mode?:AttemptMode}){
 const s=useGame(),run=attemptFor(s,id,mode),limit=deadlineFor(id,mode);
 if(!run||run.status!=='running'||limit===undefined)return null;
 const left=Math.max(0,limit-run.elapsed);
 return <div className={`attempt-deadline ${left<15?'is-urgent':''}`} role="timer" aria-label="Attempt time remaining"><Clock size={16}/><strong>{Math.ceil(left)} s</strong><span>ACTIVE PLAY REMAINING · resets do not refill this timer</span></div>;
}
export function AttemptFailure({id,mode='lesson',onRetry}:{id:TaskId;mode?:AttemptMode;onRetry:()=>void}){
 const s=useGame(),run=attemptFor(s,id,mode),left=retryRemaining(s,id,mode);
 const upstream=mode==='lesson'?(failedLessonRoots(s).find(root=>root!==id&&taskDependsOn(id,root))??blockingSurfaceIncidents(s,id)[0]?.task):undefined;
 if(run?.status!=='failed')return null;
 const progress=s.commissioning.training;
 const board=(mode==='repair'?progress.incidents?.repairs[id]:progress.tasks[id])??initialTask(id,mode==='repair');
 const review=failureReview(id,board,mode,run);
 return <section className="attempt-failed" role="status"><LockKeyhole size={30}/><h3>Attempt failed — system isolated</h3><div className="failure-review"><h4>Why this attempt failed</h4><p>{review.explanation}</p><h4>Rules before retry</h4><ol>{review.steps.map(step=><li key={step}>{step}</li>)}</ol></div><p><b>Consequence:</b> {run.reason}</p><strong>{left>0?`${cooldownLabel(left)} game hours until retry`:upstream?'Inspection complete — upstream repair required':'Inspection complete — retry available'}</strong><p>{left>0?`About ${Math.ceil(left)} seconds of active play remain. Stay here or explore; the wait does not use colony reserves.`:'Start a new attempt and complete this step to restore its dependents.'}</p>{upstream&&<p>Also waiting for <b>{taskById(upstream).title}</b>. <button onClick={()=>useTrainingUI.getState().repair(upstream)}>Open upstream repair</button></p>}<button disabled={left>0||!!upstream||s.status!=='playing'||mode==='lesson'&&!!s.pendingEvent} onClick={onRetry}>Retry {taskById(id).title}</button><small>Earlier stars and discoveries are saved. Resetting, reloading or skipping days cannot clear the lock.</small></section>;
}
export function GuidedMistakeReview({id,t}:{id:TaskId;t:TaskState}){
 if(CHALLENGE_RULES[id]||!t.lastMistake)return null;
 const review=failureReview(id,t);
 return <details className="guided-mistake-review"><summary>Last mistake · review rules</summary><p>{review.explanation}</p><ol>{review.steps.map(step=><li key={step}>{step}</li>)}</ol></details>;
}
export function FailureDependencyLock({id}:{id:TaskId}){
 const g=useGame(),root=failedLessonRoots(g).find(task=>task!==id&&taskDependsOn(id,task));
 if(!root)return null;
 return <div className="training-locked"><LockKeyhole size={30}/><h3>Waiting for a failed system</h3><p>Restore <b>{taskById(root).title}</b> before this step can run.</p><button onClick={()=>useTrainingUI.getState().repair(root)}>Open failed challenge</button></div>;
}
