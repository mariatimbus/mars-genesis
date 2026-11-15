import { ArrowRight, CheckCircle2, LockKeyhole } from 'lucide-react';
import { useGame } from '../store/game';
import { STARTUP_KINDS, commissioningComplete, type StartupKind } from '../simulation/commissioning';
import { roomNames, roomTasks } from '../training/catalog';
import { blockedRoom } from '../training/engine';
import { useTrainingUI } from '../training/ui';
import { roomSuspended,taskSuspended } from '../weather/incidents';
import { SurfaceIncidentNotice } from '../weather/IncidentPanel';
export function StartupOverview(){
 const s=useGame(),done=s.commissioning.completed.length,next=STARTUP_KINDS.find(k=>!s.commissioning.completed.includes(k));
 return <><span className="eyebrow">LANDING CHECKLIST / SOL 01</span><h3>Wake the colony</h3><p>Six rooms. Eighteen hands-on experiments. Learn how the systems depend on each other.</p><div className="progress"><span style={{width:`${done/6*100}%`}}/></div><div className="mission-progress"><span>ROOMS ONLINE</span><strong>{done} / 6</strong></div><p className="startup-reserve-note">The crew waits safely while you train. Time and colony supplies stay paused.</p><button className="secondary" onClick={()=>useTrainingUI.getState().show(next)}>Open mission challenges <ArrowRight size={15}/></button></>;
}
export function StartupChallenge({kind}:{kind:StartupKind}){
 const s=useGame(),suspended=roomSuspended(s,kind),complete=s.commissioning.completed.includes(kind)&&!suspended,list=roomTasks(kind),blocked=blockedRoom(s,kind);
 return <div className="startup-challenge"><div className={`startup-state ${complete?'ready':''}`}>{complete?<CheckCircle2 size={15}/>:<LockKeyhole size={15}/>} {suspended?'MAINTENANCE LOCK':complete?'ONLINE':'TRAINING REQUIRED'}</div><h2>{roomNames[kind]}</h2>{suspended&&<SurfaceIncidentNotice/>}<p>{complete?'Keep learning in the hands-on trainer. Your running systems and reserves stay unchanged.':blocked.length?`Training sequence: complete ${blocked.map(k=>roomNames[k]).join(', ')} first.`:'Complete all three experiments to bring this system online.'}</p><ol className="startup-step-list">{list.map((task,i)=><li key={task.id}><span>0{i+1}</span>{task.title}<span>{taskSuspended(s,task.id)?<LockKeyhole size={13}/>:s.commissioning.training.records[task.id]?`${s.commissioning.training.records[task.id]!.stars}/3 stars`:'-'}</span></li>)}</ol><button className="startup-launch" onClick={()=>useTrainingUI.getState().show(kind,true)}>{complete?'Practice experiments':'Open hands-on challenges'} <ArrowRight size={15}/></button><p>{commissioningComplete(s)?'All six rooms online. You can advance the mission from your tablet.':'Energy > Water > Oxygen > Greenhouse > Medical > Laboratory'}</p></div>;
}
