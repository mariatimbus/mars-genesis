import { tasks,taskById,type TaskId } from './catalog';
import type { SurvivalState } from '../simulation/types';
import type { TaskAction,TaskState } from './engine';

export type AttemptMode='lesson'|'repair';
export interface FailureContext {kind:'timeout'|'operation';action?:TaskAction;note?:string}
export interface ChallengeAttempt {status:'running'|'failed'|'succeeded';elapsed:number;retryAt:number;reason:string;suspends:boolean;failure?:FailureContext}
export interface ChallengeRuns {clock:number;lesson:Partial<Record<TaskId,ChallengeAttempt>>;repair:Partial<Record<TaskId,ChallengeAttempt>>}
export const RETRY_ACTIVE_SECONDS=30; // Existing scale: 720 active seconds / 24 game hours.
export const freshChallengeRuns=():ChallengeRuns=>({clock:0,lesson:{},repair:{}});
interface Rule {seconds?:number;repairSeconds?:number;fatal:string[];consequence:string}
export const CHALLENGE_RULES:Partial<Record<TaskId,Rule>>={
 dust:{seconds:60,repairSeconds:45,fatal:[],consequence:'The cleaning window closed. The array remains isolated until the maintenance interlock resets.'},
 sun:{seconds:45,fatal:[],consequence:'Tracking was not stabilized in time. The controller needs a reset before another attempt.'},
 battery:{seconds:60,repairSeconds:45,fatal:['connect'],consequence:'The protection relay rejected an open circuit. The battery bus is isolated for inspection.'},
 scan:{seconds:45,fatal:['dig'],consequence:'Drilling without a verified ice return spoiled the teaching sample. The drill must be reset.'},
 melt:{seconds:60,fatal:['heat','tick'],consequence:'The sample was lost or overheated. The tank is isolated for a cooling and pressure check.'},
 filter:{seconds:60,repairSeconds:45,fatal:['run','test'],consequence:'The sample failed filtration verification. The processing line is isolated for a flush.'},
 fill:{seconds:45,fatal:['connect'],consequence:'The fill-level check failed. The electrolysis cell is isolated until the supply line is checked.'},
 air:{seconds:60,fatal:['tick'],consequence:'The regulator left its training band or ran out of time. The control loop is isolated for a reset.'},
 lights:{seconds:60,repairSeconds:45,fatal:['test'],consequence:'The light recipe failed the energy or growth check. The lighting controller needs a reset.'},
 plant:{seconds:45,fatal:['test'],consequence:'The planting plan failed validation. The seed trays must be sorted before another attempt.'},
 irrigate:{seconds:45,fatal:['test'],consequence:'The root zones failed the moisture check. The irrigation pump is isolated for drainage and inspection.'},
 antenna:{seconds:60,fatal:['send'],consequence:'The transmission was attempted without antenna alignment. The transmitter needs a pointing check.'},
 weather:{seconds:60,repairSeconds:45,fatal:['match'],consequence:'A sensor was connected to the wrong channel. The weather bus is isolated for a wiring check.'},
};
type State=Pick<SurvivalState,'commissioning'>;
export const attemptFor=(s:State,id:TaskId,mode:AttemptMode='lesson')=>s.commissioning.training.runs?.[mode][id];
export const deadlineFor=(id:TaskId,mode:AttemptMode)=>mode==='repair'?(CHALLENGE_RULES[id]?.repairSeconds??CHALLENGE_RULES[id]?.seconds):CHALLENGE_RULES[id]?.seconds;
export const retryRemaining=(s:State,id:TaskId,mode:AttemptMode='lesson')=>Math.max(0,(attemptFor(s,id,mode)?.retryAt??0)-(s.commissioning.training.runs?.clock??0));
export const failedLessonRoots=(s:State)=>tasks.filter(t=>attemptFor(s,t.id)?.suspends).map(t=>t.id);
export function freshAttempt(previous?:ChallengeAttempt):ChallengeAttempt{return {status:'running',elapsed:0,retryAt:0,reason:'',suspends:previous?.suspends??false}}
export function withAttempt(s:SurvivalState,id:TaskId,mode:AttemptMode,run:ChallengeAttempt):SurvivalState {
 const runs=s.commissioning.training.runs??freshChallengeRuns();
 return {...s,commissioning:{...s.commissioning,training:{...s.commissioning.training,runs:{...runs,[mode]:{...runs[mode],[id]:run}}}}};
}
export function failAttempt(s:SurvivalState,id:TaskId,mode:AttemptMode,run:ChallengeAttempt,reason=CHALLENGE_RULES[id]!.consequence,failure:FailureContext={kind:'operation'}){
 const clock=s.commissioning.training.runs?.clock??0;
 const n=withAttempt(s,id,mode,{...run,status:'failed',retryAt:clock+RETRY_ACTIVE_SECONDS,reason,suspends:mode==='lesson',failure});
 const message=`${taskById(id).title}: attempt failed. ${reason} Retry after one game hour (30 active seconds).`;
 return {...n,message,notifications:[...s.notifications,message],history:[...s.history,message]};
}
export function fatalAttemptAction(id:TaskId,current:TaskState,next:TaskState,action:TaskAction){
 if(id==='melt'&&action.type==='lid'&&current.values[7]===1)return true;
 return next.mistakes>current.mistakes&&!!CHALLENGE_RULES[id]?.fatal.includes(action.type);
}
export function needsChallengeClock(s:State){
 const runs=s.commissioning.training.runs;if(!runs)return false;
 return (['lesson','repair'] as const).some(mode=>Object.entries(runs[mode]).some(([id,a])=>a&&(a.status==='running'&&deadlineFor(id as TaskId,mode)!==undefined||a.status==='failed'&&a.retryAt>runs.clock)));
}
/** Active-play time, never wall time, crew inspection time or skipped sols. */
export function advanceChallengeClock(s:SurvivalState,delta:number):SurvivalState {
 if(s.status!=='playing'||!Number.isFinite(delta)||delta<=0||!needsChallengeClock(s))return s;
 const dt=Math.min(.5,delta),old=s.commissioning.training.runs!;
 let n:SurvivalState={...s,commissioning:{...s.commissioning,training:{...s.commissioning.training,runs:{clock:old.clock+dt,lesson:{...old.lesson},repair:{...old.repair}}}}};
 for(const mode of ['lesson','repair'] as const)for(const [key,run] of Object.entries(old[mode])){
  if(run?.status!=='running')continue;const id=key as TaskId,next={...run,elapsed:run.elapsed+dt};
  n=withAttempt(n,id,mode,next);const limit=deadlineFor(id,mode);
  if(limit!==undefined&&next.elapsed>=limit)n=failAttempt(n,id,mode,next,`Time limit reached. This step remains isolated until inspection and a successful retry.`,{kind:'timeout'});
 }
 return n;
}
export function cooldownLabel(seconds:number){const minutes=Math.ceil(seconds/RETRY_ACTIVE_SECONDS*60);return `${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`}
