import { Siren,Wrench } from 'lucide-react';
import { useGame } from '../store/game';
import { useExplorer } from '../explorer/store';
import { useTrainingUI } from '../training/ui';
import { roomNames,taskById } from '../training/catalog';
import { baseAlertState } from './alertState';
import './baseAlert.css';

export function BaseAlert(){
 const g=useGame(),trainingOpen=useTrainingUI(s=>s.open),mode=useExplorer(s=>s.mode),panelOpen=useExplorer(s=>!!s.panel),alert=baseAlertState(g);
 if(!g.prologueSeen||g.status!=='playing'||trainingOpen||panelOpen||!alert.active)return null;
 const first=alert.incidents.find(e=>e.task===alert.roots[0])!;
 const room=roomNames[taskById(first.task).room];
 const isWarning=alert.severity==='warning';
 const title=isWarning?'BASE WARNING · SYSTEMS AFFECTED':'BASE ALERT · SYSTEMS ISOLATED';
 return <div className={`base-emergency is-${mode} is-${alert.severity}`}>
  <div className="base-emergency-frame" aria-hidden="true"/>
  <section className="base-emergency-banner" aria-label="Base emergency alert">
   <Siren className="base-emergency-icon" size={30} aria-hidden="true"/>
   <div className="base-emergency-copy" role="alert" key={alert.roots.join(',')}><strong>{title}</strong><p>{first.title}</p><small>{room} · {alert.roots.length===1?'Repair required':`${alert.roots.length} repairs required`} · dependent rooms paused · fresh incidents turn red after {2} sols</small></div>
   <button onClick={()=>useTrainingUI.getState().repair(first.task)}><Wrench size={16}/> Open repair</button>
  </section>
 </div>;
}
