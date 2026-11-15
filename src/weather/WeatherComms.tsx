import { useEffect,useRef,useState } from 'react';
import { ArrowRight,Wrench,Clock3 } from 'lucide-react';
import { useGame } from '../store/game';
import { useExplorer } from '../explorer/store';
import { makeLayout } from '../explorer/layout';
import { useTrainingUI } from '../training/ui';
import { activeSurfaceIncidents,pendingIncidentTasks } from './incidents';
import { incidentBriefing } from './briefingScript';
import './incidentBriefing.css';

/** Illustrated comms portrait: no extra WebGL context while the base is rendering. */
function CommsAstronaut({name}:{name:string}){
 return <svg className="comms-astronaut" viewBox="0 0 220 260" role="img" aria-label={`${name}, astronaut responsible for this repair`}>
 <defs><linearGradient id="comms-suit" x2="1" y2="1"><stop stopColor="#f5efe3"/><stop offset=".55" stopColor="#a9b4bd"/><stop offset="1" stopColor="#506376"/></linearGradient><linearGradient id="comms-visor" x2=".6" y2="1"><stop stopColor="#152839"/><stop offset=".55" stopColor="#765e38"/><stop offset="1" stopColor="#192b35"/></linearGradient></defs>
 <path fill="#364651" stroke="#728592" strokeWidth="3" d="M52 147v-40h116v45l24 52H29z"/>
 <path fill="url(#comms-suit)" stroke="#263947" strokeWidth="3" d="M58 141 34 154 12 242l39 15 12-57v60h99v-60l13 57 34-15-22-88-27-15z"/>
 <path fill="#33434f" d="M62 145h99v18H62z"/><path fill="#d9e2e2" stroke="#6d808a" strokeWidth="3" d="M48 71c0-74 124-74 124 0v45c0 51-124 51-124 0z"/>
 <path fill="url(#comms-visor)" stroke="#263641" strokeWidth="8" d="M58 71c0-50 104-50 104 0v32c0 37-104 37-104 0z"/>
 <path fill="#c7e4ec" opacity=".38" d="M66 64q13-25 42-22l-18 10-14 42z"/><path fill="none" stroke="#edd2a1" opacity=".6" strokeWidth="3" d="M151 69v25q0 24-39 27"/>
 <rect x="77" y="176" width="67" height="46" rx="4" fill="#324956" stroke="#8d9ca3" strokeWidth="3"/><path stroke="#76decf" strokeWidth="3" d="M86 190h22m-22 9h13"/><circle cx="130" cy="192" r="4" fill="#f3bc61"/>
 <path stroke="#536a77" strokeWidth="7" fill="none" d="M73 139q-34 39-14 74"/><path stroke="#dd893e" strokeWidth="5" d="M35 166 24 208m154-42 11 42"/><text x="110" y="243" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#263c4c">ARES ONE · {name.toUpperCase()}</text>
 </svg>;
}
export function IncidentBriefing(){
 const g=useGame(),trainingOpen=useTrainingUI(s=>s.open);
 const pending=activeSurfaceIncidents(g).find(e=>!g.commissioning.training.incidents?.briefed?.includes(e.id));
 const id=pending?.id,[page,setPage]=useState(0),button=useRef<HTMLButtonElement>(null);
 useEffect(()=>{
  if(!id||!g.prologueSeen||g.status!=='playing'||trainingOpen)return;
  setPage(0);
  useExplorer.setState({briefing:true,mode:'first-person',pauseOpen:false,mapExpanded:false});
  useExplorer.getState().returnToBase(makeLayout(useGame.getState().buildings));
  button.current?.focus();
 },[id,g.prologueSeen,g.status,trainingOpen]);
 useEffect(()=>{if(!id)useExplorer.setState({briefing:false})},[id]);
 if(!pending||!g.prologueSeen||g.status!=='playing'||trainingOpen)return null;
 const briefing=incidentBriefing(pending.id),last=page===briefing.pages.length-1;
 const finish=(later:boolean)=>{
  g.acknowledgeIncident(pending.id,later);
  useExplorer.setState({briefing:false,pauseOpen:false});
  if(later)useExplorer.getState().notify('Repair deferred · Esc → Mission Control lists both mandatory checks.');
  else useTrainingUI.getState().repair(pendingIncidentTasks(useGame.getState(),pending)[0]??pending.task);
 };
 return <aside className="incident-comms" aria-label="Astronaut incident briefing">
  <div className="comms-bubble"><header><span className="comms-live"/> CREW COMMS <small>{page+1} / {briefing.pages.length}</small></header><h2>{briefing.name}<small>{briefing.role} · {briefing.room}</small></h2><p key={`${id}:${page}`} aria-live="polite">{briefing.pages[page]}</p><footer>{page>0&&<button className="comms-back" onClick={()=>setPage(page-1)}>Back</button>}{last?<><button ref={button} onClick={()=>finish(false)}><Wrench size={15}/> Resolve</button><button className="comms-later" onClick={()=>finish(true)}><Clock3 size={15}/> Later</button></>:<button ref={button} onClick={()=>setPage(page+1)}>Next <ArrowRight size={15}/></button>}</footer>{last&&<small className="comms-cost">Later adds a mandatory check in another room. Esc → Mission Control to return.</small>}</div><CommsAstronaut name={briefing.name}/>
 </aside>;
}
