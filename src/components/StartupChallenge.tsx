import { CheckCircle2, LockKeyhole, ArrowRight } from 'lucide-react';
import { useGame } from '../store/game';
import { STARTUP_CHALLENGES, STARTUP_KINDS, commissioningComplete, type StartupKind } from '../simulation/commissioning';
import { catalog } from '../simulation/engine';

export function StartupOverview(){
 const s=useGame(),done=s.commissioning.completed.length;
 const next=STARTUP_KINDS.find(k=>!s.commissioning.completed.includes(k));
 return <><span className="eyebrow">LANDING CHECKLIST · SOL 01</span><h3>Bring your colony to life</h3><p>Robots assembled the facilities. Now it’s your turn to make them work.</p><div className="progress"><span style={{width:`${done/7*100}%`}}/></div><div className="mission-progress"><span>STARTUP CHALLENGES</span><strong>{done} / 7</strong></div><p className="startup-reserve-note">The crew waits safely in the lander. Time and supplies stay paused while you complete the challenges.</p>{next&&<button className="secondary" onClick={()=>s.select(s.buildings.find(b=>b.kind===next)?.id??null)}>Start {STARTUP_CHALLENGES.find(c=>c.kind===next)!.label.toLowerCase()} challenge <ArrowRight size={15}/></button>}</>;
}
export function StartupChallenge({kind}:{kind:StartupKind}){
 const s=useGame(),challenge=STARTUP_CHALLENGES.find(c=>c.kind===kind)!;
 const complete=s.commissioning.completed.includes(kind);
 const feedback=s.commissioning.feedback?.kind===kind?s.commissioning.feedback:null;
 const next=STARTUP_KINDS.find(k=>!s.commissioning.completed.includes(k));
 return <div className="startup-challenge">
  
  <div className={`startup-state ${complete?'ready':''}`}>{complete?<CheckCircle2 size={15}/>:<LockKeyhole size={15}/>} {complete?'UNLOCKED':'LOCKED'}</div>
  <h2>{challenge.label}</h2>
  {!complete&&<><h3>{challenge.question}</h3><div className="startup-choices">{challenge.options.map((option,i)=><button key={option.id} onClick={()=>s.answerStartup(kind,option.id)}><span>{String(i+1).padStart(2,'0')}</span>{option.text}</button>)}</div></>}
  {feedback&&<div role="status" className={`startup-feedback ${feedback.correct?'correct':'retry'}`}><strong>{feedback.correct?'Challenge complete.':'Think it through and try again.'}</strong><p>{feedback.text}</p></div>}
  {complete&&<><button className="secondary" onClick={()=>s.select(next?s.buildings.find(b=>b.kind===next)?.id??null:null)}>{commissioningComplete(s)?'Return to your colony':`Next: ${STARTUP_CHALLENGES.find(c=>c.kind===next)!.label}`}<ArrowRight size={15}/></button></>}
 </div>;
}
