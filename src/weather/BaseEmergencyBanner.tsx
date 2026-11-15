import { Siren,Wrench } from 'lucide-react';
import { useGame } from '../store/game';
import { useExplorer } from '../explorer/store';
import { useTrainingUI } from '../training/ui';
import { roomNames,taskById } from '../training/catalog';
import { pendingIncidentTasks } from './incidents';
import { baseAlertState } from './alertState';
import './baseAlert.css';

export function BaseAlert({inline=false}:{inline?:boolean}){
 const g=useGame(),trainingOpen=useTrainingUI(s=>s.open),mode=useExplorer(s=>s.mode),panelOpen=useExplorer(s=>!!s.panel),alert=baseAlertState(g);
 if(!g.prologueSeen||g.status!=='playing'||trainingOpen||panelOpen||!alert.active||(mode==='first-person')!==inline)return null;
 const first=alert.incidents.find(event=>pendingIncidentTasks(g,event).length)!;
 const pending=[...new Set(alert.incidents.flatMap(event=>pendingIncidentTasks(g,event)))],next=pendingIncidentTasks(g,first)[0]??first.task;
 const room=roomNames[taskById(next).room];
 const isWarning=alert.severity==='warning';
 const title=inline?(isWarning?'MAINTENANCE REQUIRED':'CRITICAL ALERT'):(isWarning?'BASE WARNING · SYSTEMS AFFECTED':'BASE ALERT · SYSTEMS ISOLATED');
 return <div className={`base-emergency ${inline?'is-inline':''} is-${mode} is-${alert.severity}`}>
  <div className="base-emergency-frame" aria-hidden="true"/>
  <section className="base-emergency-banner" aria-label="Base emergency alert">
   <Siren className="base-emergency-icon" size={30} aria-hidden="true"/>
   <div className="base-emergency-copy" role="alert" key={alert.roots.join(',')}><strong>{title}</strong><p>{first.title}</p><small>{room} · {pending.length===1?'Repair required':`${pending.length} repairs required`}{!inline&&' · dependent rooms paused · fresh incidents turn red after 2 sols'}</small></div>
   <button onClick={()=>useTrainingUI.getState().repair(next)}><Wrench size={16}/> Open repair</button>
  </section>
 </div>;
}
