import { useEffect } from 'react';
import { Cloud,Wind,Sun,ChevronLeft,ChevronRight,ExternalLink,SkipForward } from 'lucide-react';
import { surfaceWeather,SURFACE_CALENDAR,SURFACE_SOLS,WEATHER_SOURCES,nextImportantWeather } from './calendar';
import { useSurfaceWeather } from './store';
import { useExplorer } from '../explorer/store';
import { useTrainingUI } from '../training/ui';
import { useGame } from '../store/game';
import { failedLessonRoots } from '../training/attempts';
import { activeSurfaceIncidents } from './incidents';
import { SurfaceIncidentNotice } from './IncidentPanel';
import { travelToSurfaceSol } from './travel';
import './weather.css';

function WeatherIcon({dust,cloud}:{dust:number;cloud:number}){return dust>.4?<Wind size={17}/>:cloud>.35?<Cloud size={17}/>:<Sun size={17}/>}
export function WeatherHUD({onSkip}:{onSkip?:()=>void}){
 const sol=useSurfaceWeather(s=>s.sol),w=surfaceWeather(sol);
 const blocked=useSurfaceWeather(s=>s.blocked);
 useEffect(()=>{
  let toast='',timer:ReturnType<typeof setTimeout>|undefined;
  const clearToast=()=>{if(toast&&useExplorer.getState().notice===toast)useExplorer.getState().notify('')};
  const key=(e:KeyboardEvent)=>{
   const target=e.target as HTMLElement|null;
   const explorer=useExplorer.getState();
   if(e.code!=='KeyN'||e.repeat||e.ctrlKey||e.metaKey||e.altKey||target?.isContentEditable||target?.closest('input,textarea,select')||(!explorer.locked&&target?.closest('button,summary'))||explorer.panel||useTrainingUI.getState().open)return;
   e.preventDefault();if(useSurfaceWeather.getState().blocked){const incident=activeSurfaceIncidents(useGame.getState())[0];const task=incident?.task??failedLessonRoots(useGame.getState())[0];if(task)useTrainingUI.getState().repair(task);return;}
   const event=nextImportantWeather(useSurfaceWeather.getState().sol);if(!event)return;
   if(!travelToSurfaceSol(event.sol))return;onSkip?.();
   clearTimeout(timer);toast=`Surface sol ${event.sol} · ${event.title}. Check the maintenance locks.`;
   useExplorer.getState().notify(toast);timer=setTimeout(clearToast,4000);
  };
  window.addEventListener('keydown',key);return()=>{window.removeEventListener('keydown',key);clearTimeout(timer);clearToast()};
 },[onSkip]);
 return <div className={`surface-weather-hud ${w.dust>.6?'is-dusty':''}`} aria-label={`Surface weather sol ${sol}`}>
  <span><WeatherIcon {...w}/> SURFACE SOL {String(sol).padStart(3,'0')} / 720</span><strong>{w.title}</strong>
  <small>{w.wind>.6?'Strong gusts':w.wind>.4?'Windblown dust':'Light drifting dust'} · {w.cloud>.6?'Ice-cloud veil':w.dust>.6?'Low visibility':'Open horizon'}</small>
  <em>Visual reconstruction · N → next event</em>
  {blocked&&<small className="surface-maintenance-label">🔒 Systems on hold · Esc → Restore this step</small>}
 </div>;
}
export function WeatherSkipControls({onSkip}:{onSkip?:()=>void}){
 const sol=useSurfaceWeather(s=>s.sol),blocked=useSurfaceWeather(s=>s.blocked),event=nextImportantWeather(sol);
 return <div className="weather-skip-controls"><SurfaceIncidentNotice/><button className="fps-secondary" disabled={!event||blocked} onClick={()=>{if(event&&travelToSurfaceSol(event.sol))onSkip?.()}}><SkipForward size={14}/>{blocked?'Repair systems before skipping':event?`Skip to next event · Sol ${event.sol}`:'No more archived events'}</button><small>{event?`${event.title} · shortcut N`:'You have reached the last documented event.'}<br/>Surface events can suspend experiments until you repair the affected step.</small></div>;
}
const milestones=[{sol:1,label:'Clear'},{sol:291,label:'Ice clouds'},{sol:316,label:'Storm'},{sol:574,label:'Dust peak'},{sol:703,label:'Tides'}];
export function WeatherInspector({onContinue}:{onContinue:()=>void}){
 const actualSol=useSurfaceWeather(s=>s.sol),previewSol=useSurfaceWeather(s=>s.previewSol),blocked=useSurfaceWeather(s=>s.blocked),sol=previewSol??actualSol,w=surfaceWeather(sol);
 const nextEvent=nextImportantWeather(sol);
 const choose=(n:number)=>useSurfaceWeather.getState().preview(n),source=WEATHER_SOURCES[w.source];
 return <section className="weather-inspector" aria-label="720-sol exterior weather calendar">
  <div className="weather-panel-heading"><span>JEZERO / SURFACE ARCHIVE</span><small>720 SOLS</small></div>
  <div className="weather-day"><button aria-label="Previous weather sol" disabled={sol===1} onClick={()=>choose(sol-1)}><ChevronLeft size={18}/></button><div><small>PREVIEW / SOL</small><strong>{String(sol).padStart(3,'0')}<span> / {SURFACE_SOLS}</span></strong></div><button aria-label="Next weather sol" disabled={sol===SURFACE_SOLS} onClick={()=>choose(sol+1)}><ChevronRight size={18}/></button></div>
  <div className="weather-timeline"><svg viewBox="0 0 720 52" role="img" aria-label="Modeled dust in amber and ice clouds in blue over 720 sols" preserveAspectRatio="none">
   {Array.from({length:144},(_,i)=>{const days=SURFACE_CALENDAR.slice(i*5,i*5+5);return <g key={i}><rect x={i*5} y={51-Math.max(...days.map(d=>d.cloud))*45} width={3} height={Math.max(...days.map(d=>d.cloud))*45} fill="#99bcd3" opacity=".45"/><rect x={i*5+2} y={51-Math.max(...days.map(d=>d.dust))*45} width={2} height={Math.max(...days.map(d=>d.dust))*45} fill="#d5a273" opacity=".8"/></g>})}
   <path d={`M${sol-.5} 0V52`} stroke="#eff0d6" strokeWidth="2"/>
  </svg><input type="range" min={1} max={SURFACE_SOLS} step={1} value={sol} aria-label="Preview surface sol" aria-valuetext={`Sol ${sol}: ${w.title}`} onChange={e=>choose(Number(e.target.value))}/><div><span>001</span><span>360</span><span>720</span></div></div>
  <nav className="weather-milestones" aria-label="Weather examples">{milestones.map(m=><button key={m.sol} className={sol===m.sol?'selected':''} onClick={()=>choose(m.sol)}>{m.label}<small>{m.sol}</small></button>)}</nav>
  <button className="weather-next-event" disabled={!nextEvent||blocked} onClick={()=>{if(nextEvent&&travelToSurfaceSol(nextEvent.sol))onContinue()}}><SkipForward size={13}/>{nextEvent?`Skip to event · Sol ${nextEvent.sol}`:'Last documented event reached'}</button>
  <h2><WeatherIcon {...w}/>{w.title}</h2>
  <div className="weather-basis">{w.basis==='archived-period'?'DOCUMENTED PERIOD · ARTISTIC RECONSTRUCTION':'MODELED DAY · MEDA SCIENCE REFERENCE'}</div>
  <p className="weather-fact">{w.description}</p>
  <div className="weather-tags"><span>{w.cloud>.6?'Water-ice veil':w.cloud>.25?'Thin ice wisps':'Sparse cloud'}</span><span>{w.dust>.6?'Dense dust':w.dust>.3?'Dust haze':'Light dust'}</span><span>{w.wind>.6?'Strong gusts':'Drifting wind'}</span></div>
  <button className="weather-continue" disabled={blocked} onClick={()=>{if(travelToSurfaceSol(sol))onContinue()}}>{blocked?'Repair active systems before changing days':`Skip to sol ${sol} & return to habitat`} <ChevronRight size={15}/></button>
  <button className="weather-return" onClick={()=>choose(actualSol)}>Return to current surface sol · {actualSol}</button>
  <details><summary>Evidence &amp; how time advances</summary><p>This is a 720-sol weather calendar with fictional maintenance scenarios. The linked periods are archived observations; daily cloud shapes, wind and dust strength are authored reconstructions. No live NASA feed or 720 measured daily records are claimed.</p><p>One exterior sol lasts 12 minutes of active exploration. Esc, tablets, challenges and this inspector pause it. Advancing the mission also advances the surface calendar. N skips to the next documented exterior event while exploring. Active maintenance locks pause skip and sol progression until the affected experiment is repaired. The 30-sol colony campaign has its own clock.</p><a href={source.url} target="_blank" rel="noreferrer">{source.title} <ExternalLink size={11}/></a><a href={WEATHER_SOURCES.meda.url} target="_blank" rel="noreferrer">MEDA instrument &amp; archive <ExternalLink size={11}/></a><p>DONKI supplies space-weather records; it is not used to invent visible surface storms. MOXIE concerns oxygen experiments. Their gameplay effects are reserved for a later stage.</p><a href={WEATHER_SOURCES.donki.url} target="_blank" rel="noreferrer">NASA DONKI <ExternalLink size={11}/></a><a href={WEATHER_SOURCES.moxie.url} target="_blank" rel="noreferrer">NASA MOXIE <ExternalLink size={11}/></a></details>
 </section>;
}
