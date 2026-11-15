import { RenderBudget } from './RenderBudget';
import { FrameProbe,FrameReadout,profiling } from './FrameProbe';
import { hasSystemLocks,hasSurfaceIncidents } from '../weather/incidents';
import { WeatherHUD, WeatherSkipControls } from '../weather/WeatherPanel';
import { BaseAlert } from '../weather/BaseEmergencyBanner';
import { CrewClock, CrewTimeControls } from '../characters/CrewClock';
import { useCrewLife } from '../characters/crewStore';
import { activityLabel } from '../characters/crewRoutine';
import { Suspense, useCallback, useEffect, useMemo, useState, Component, type ReactNode } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Wind, Heart, Activity, X, Shield, ArrowRight, AlertTriangle } from 'lucide-react';
import { Astronaut, Base } from './World';
import { BaseMap } from './BaseMap';
import { MarsExterior, MarsSky } from './Exterior';
import SurfacePreview from './SurfacePreview';
import { ExpeditionHUD } from './ExpeditionHUD';
import { IndustrialLighting } from '../visuals/IndustrialLighting';
import { INDUSTRIAL as C } from '../visuals/palette';
import { SuitReflections } from '../characters/SuitReflections';
import { makeLayout, environmentAt, roomAt, inAirlock } from './layout';
import { useExplorer } from './store';
import { useGame, simulationSnapshot } from '../store/game';
import { catalog } from '../simulation/engine';
import { calculateOperations } from '../simulation/lifeSupport';
import { commissioningComplete, facilityUnlocked, startupKind } from '../simulation/commissioning';
import { decisionOptions, eventDefinition, optionBlocked } from '../simulation/events';
import { sourceById } from '../nasa/sources';
import { useTrainingUI } from '../training/ui';
import { StartupChallenge } from '../components/StartupChallenge';
import { CrewPanel } from '../components/CrewPanel';
import { OperationsPanel } from '../components/OperationsPanel';
import { MissionResults } from '../components/MissionResults';
import type { Assignment } from '../simulation/types';

class PhysicsBoundary extends Component<{children:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true}}render(){return this.state.failed?<div className="fps-loading"><p>The astronaut renderer could not start.</p><button onClick={()=>useExplorer.getState().modeTo('overview')}>Open colony view</button></div>:this.props.children}}
function Repair({id}:{id:string}){
 const g=useGame(),e=useExplorer(),[isolated,setIsolated]=useState(false),[values,setValues]=useState([50,50,50]),[result,setResult]=useState('');
 const targets=[30,65,45],balanced=values.every((v,i)=>Math.abs(v-targets[i])<=4);
 const done=id==='external-relay'?g.flags.includes('eva-relay-repaired'):(g.buildings.find(b=>b.id===id)?.damage??0)===0;
 return <><span className="fps-eyebrow">HANDS-ON REPAIR · SIMULATION</span><h2>{id==='external-relay'?'External power relay':'Equipment repair'}</h2>{done?<div className="repair-success"><Shield/>Repair complete.<p>{g.message}</p><button onClick={()=>e.open(null)}>Back to EVA</button></div>:<>
 <p>Isolate power, balance the three circuits, then reconnect. Costs 4 materials and 1 kWh.</p>
 <button className={`repair-isolate ${isolated?'done':''}`} onClick={()=>setIsolated(true)}>{isolated?'01 · Power isolated ✓':'01 · Isolate power'}</button>
 <div className={!isolated?'repair-disabled':''}>{targets.map((target,i)=><label className="repair-circuit" key={i}><span>Circuit {i+1}<small>Target {target-4}–{target+4}</small></span><input type="range" aria-label={`Circuit ${i+1}`} min={0} max={100} value={values[i]} disabled={!isolated} onChange={ev=>setValues(v=>v.map((x,j)=>i===j?Number(ev.target.value):x))}/><strong className={Math.abs(values[i]-target)<=4?'balanced':''}>{values[i]}</strong></label>)}</div>
 <button disabled={!isolated||!balanced} onClick={()=>{if(!g.fieldRepair(id))setResult('Need 4 materials and 1 kWh. The repair has not been completed.')}}>03 · Reconnect circuits</button>{result&&<p role="status">{result}</p>}
 </>}</>;
}
function EquipmentPanel({id}:{id:string}){
 const g=useGame(),e=useExplorer(),b=g.buildings.find(b=>b.id===id);if(!b)return <p>Equipment unavailable.</p>;
 const ready=facilityUnlocked(g,b.kind),r=calculateOperations(simulationSnapshot(g)).report;
 return <>{!ready?<StartupChallenge kind={startupKind(b.kind)}/>:<><span className="fps-eyebrow">IN-WORLD TERMINAL</span><h2>{catalog[b.kind].name}</h2><p className="terminal-state">{(b.damage??0)>0?`Fault · ${b.damage}% damage`:b.active?'Enabled':'Offline'}</p><p>{catalog[b.kind].description}</p><div className="terminal-readouts"><span>Battery<strong>{g.resources.power.toFixed(1)} kWh</strong></span><span>Water<strong>{g.systems.waterKg.toFixed(1)} kg</strong></span><span>Solar<strong>{r.generatedKwh.toFixed(1)} kWh/sol</strong></span></div>
 {(b.damage??0)>0?<button onClick={()=>e.open({type:'repair',id})}>Repair this equipment</button>:<><button onClick={()=>g.fieldUse(id,e.playerId)}>{b.kind==='storage'?'Collect supplies':b.kind==='habitat'?'Rest':b.kind==='medical'?'Treatment & rest':b.kind==='greenhouse'?'Collect food':b.kind==='research'?'Run experiment':'Run equipment cycle'} <small>3 kWh · once per sol</small></button><button className="fps-secondary" onClick={()=>{g.select(id);g.toggle()}}>{b.active?'Power down':'Power on'}</button></>}
 <button className="fps-secondary" onClick={()=>useTrainingUI.getState().show(startupKind(b.kind),true)}>Practice room challenges</button><p role="status" className="terminal-message">{g.message}</p></>}</>;
}
function CrewConversation({id}:{id:string}){
 const presence=useCrewLife(s=>s.members[id]);
 const g=useGame(),e=useExplorer(),c=g.astronauts.find(c=>c.id===id);if(!c)return null;
 const line=c.health<50?'I need reliable life support and recovery time.':c.fatigue>=60?'I am tired. Can we schedule a rest shift?':c.role==='Engineer'?'The external relay is limiting solar output. Isolate it before reconnecting the circuits.':c.role==='Botanist'?'The crops need water and power. I can improve food production while assigned to the greenhouse.':'The medical bay helps recovery. Research is useful, but life support comes first.';
 return <><span className="fps-eyebrow">CREW COMMS</span><h2>{c.name}</h2><p>{c.role} · {c.condition}</p>{presence&&<p className="crew-conversation-state">{activityLabel(presence)}</p>}<blockquote>“{line}”</blockquote><div className="terminal-readouts"><span>Health<strong>{c.health.toFixed(0)}%</strong></span><span>Fatigue<strong>{c.fatigue.toFixed(0)}%</strong></span></div><label className="fps-assignment">Task<select value={c.assignment} disabled={!c.alive} onChange={ev=>g.assign(c.id,ev.target.value as Assignment)}>{['command','maintenance','greenhouse','research','medical','rest','shelter'].map(a=><option key={a} value={a}>{a}</option>)}</select></label><p>Assignments affect the colony’s actual production and recovery.</p></>;
}
function TabletPanel(){
 const [tab,setTab]=useState('mission'),g=useGame(),e=useExplorer();
 return <><span className="fps-eyebrow">ASTRONAUT TABLET · SOL {g.sol} / 30</span><h2>Genesis</h2><nav className="tablet-tabs">{['mission','crew','systems'].map(t=><button className={tab===t?'selected':''} key={t} onClick={()=>setTab(t)}>{t}</button>)}</nav>
 {tab==='crew'?<CrewPanel/>:tab==='systems'?<OperationsPanel/>:<>
 <div className="terminal-readouts">{[['Oxygen',g.resources.oxygen,'kg'],['Battery',g.resources.power,'kWh'],['Food',g.resources.food,'kg'],['Materials',g.resources.materials,'units']].map(([n,v,u])=><span key={n}>{n}<strong>{Number(v).toFixed(1)} {u}</strong></span>)}</div>
 <button className="fps-secondary" onClick={()=>useTrainingUI.getState().show()}>Mission challenges &amp; Discovery Book</button><h3>{g.flags.includes('eva-relay-repaired')?'External relay restored':'Repair the external relay'}</h3><p>Equip a suit at the habitat locker. Enter the airlock, close the inner door, cycle pressure, then open the outer door. The relay is to the right of the exit.</p>
 {!commissioningComplete(g)&&<p>Commission the six training rooms at their physical control terminals. Sol progression stays paused during startup.</p>}
 {g.pendingEvent&&<div className="tablet-alert"><span className="fps-eyebrow">MISSION ALARM · MODELED CONSEQUENCES</span><h3>{eventDefinition(g.pendingEvent.kind).title}</h3><p>{eventDefinition(g.pendingEvent.kind).explanation}</p>{g.pendingEvent.buildingId&&<p>Visit the {catalog[g.buildings.find(b=>b.id===g.pendingEvent!.buildingId)!.kind].name} terminal for a hands-on repair.</p>}{decisionOptions(g).map(o=><button key={o.id} disabled={!!optionBlocked(g,o)} title={optionBlocked(g,o)} onClick={()=>g.decide(o.id)}>{o.title}<small>{o.cost}</small></button>)}<a href={sourceById(g.pendingEvent.sourceId).url} target="_blank" rel="noreferrer">Archived NASA source ↗</a></div>}
 <button disabled={!commissioningComplete(g)||!!g.pendingEvent||g.status!=='playing'||hasSystemLocks(g)} onClick={g.next}>Advance one sol <ArrowRight size={15}/></button>
 <details><summary>3D model credits</summary><p>Spacesuit scan: Smithsonian Digitization Programs Office and National Air and Space Museum, Neil Armstrong Apollo 11 spacesuit. Adapted with added life-support equipment and idle motion for fictional crew. <a href="/models/astronaut/CREDITS.txt" target="_blank" rel="noreferrer">Source, usage terms and modifications</a>.</p></details><details><summary>Simulation models & controls</summary><p>WASD move · Mouse look · Hold Shift for 3× speed · E interact · Tab tablet · Esc pause/release mouse.</p><p>EVA uses a compressed eight-minute suit budget, not a NASA physiological prediction. Sprinting consumes oxygen faster. Pressurizing costs 0.05 kg O₂ and 0.2 kWh; a full suit refill uses 0.2 kg of colony oxygen. EVA health/fatigue are gameplay scores. Modeled radiation accumulates in mSv using the archived RAD baseline and the existing event model; it does not cause invented instant radiation sickness. Colony resources advance by sol; EVA time advances while you are actively exploring. Esc and open panels pause EVA.</p></details>
 </>}
 </>;
}
function HUD({layout:l,onPreview}:{layout:ReturnType<typeof makeLayout>;onPreview:(view:'surface'|'interior')=>void}){
 const returnHome=useCallback(()=>useExplorer.getState().returnToBase(l),[l]);
 const g=useGame(),e=useExplorer(useShallow(s=>({playerId:s.playerId,notice:s.notice,activeRover:s.activeRover,position:s.position,pressure:s.pressure,suited:s.suited,oxygen:s.oxygen,evaSeconds:s.evaSeconds,cycle:s.cycle,locked:s.locked,panel:s.panel,pauseOpen:s.pauseOpen,briefing:s.briefing,target:s.target,ready:s.ready,rovers:s.rovers,returnToBase:s.returnToBase,modeTo:s.modeTo,boardRover:s.boardRover,open:s.open}))),player=g.astronauts.find(c=>c.id===e.playerId)??g.astronauts[0];
 useEffect(()=>{const notice=e.notice;if(!notice)return;const timer=setTimeout(()=>{if(useExplorer.getState().notice===notice)useExplorer.getState().notify('')},6000);return()=>clearTimeout(timer)},[e.notice]);
 const forecast=useMemo(()=>calculateOperations(simulationSnapshot(g)).report,[g]),support=!commissioningComplete(g)||(forecast.safeHabitat&&forecast.co2Removal&&g.systems.co2Percent<.8),where=e.activeRover?'PRESSURIZED ROVER CABIN':environmentAt(l,e.position,e.pressure,support),safe=!!e.activeRover||(inAirlock(l,e.position)?e.pressure>.99:l.cells.has(`${Math.round(e.position[0]/3)},${Math.round(e.position[2]/3)}`)&&support);
 const objective=hasSystemLocks(g)?'Repair the marked system':g.pendingEvent?'Review the mission alarm':!commissioningComplete(g)?`Activate the base · ${Object.keys(g.commissioning.training.records).length}/18`:!g.flags.includes('eva-relay-repaired')?'Repair the external relay':'Base online · continue the mission';
 return <div className={`fps-hud ${e.pauseOpen&&!e.briefing?'is-paused':'is-exploring'} ${e.panel?'is-panel-open':''} ${hasSurfaceIncidents(g)?'has-base-alert':''}`}>
 <div className="hud-left-column">
  <div className="fps-top"><div><span className="fps-eyebrow">ARES ONE</span><strong>{where}</strong></div></div>
  <div className="hud-status-strip"><CrewClock compact/><WeatherHUD compact onSkip={returnHome}/></div>
  <div className="fps-objective"><span className="fps-eyebrow">CURRENT OBJECTIVE</span><strong>{objective}</strong></div>
 </div>
 <div className="hud-right-column"><BaseMap layout={l}/><BaseAlert inline/></div>
 {e.locked&&!e.panel&&<><div className="fps-crosshair"/><div className="hud-context-column">{e.notice&&<div className="fps-notice" role="status">{e.notice}</div>}{e.target&&<div className="fps-prompt"><kbd>E</kbd>{e.target.label}</div>}<ExpeditionHUD/></div></>}
 <div className="fps-vitals"><span><Heart size={17}/><strong>{player.health.toFixed(0)}</strong><small>HEALTH</small></span><span className={!safe&&e.oxygen<25?'warning':''}><Wind size={17}/><strong>{e.activeRover?'CABIN':e.suited?e.oxygen.toFixed(0):safe?'CABIN':'NO SUIT'}</strong><small>{e.suited?'SUIT O₂ %':'OXYGEN'}</small></span><span><Activity size={17}/><strong>{player.fatigue.toFixed(0)}%</strong><small>FATIGUE</small></span><>{!safe&&e.suited&&<span className="fps-eva-time"><Shield size={17}/><strong>{Math.max(0,480-Math.floor(e.evaSeconds))}s</strong><small>EVA TIME</small></span>}</></div>
 <div className="fps-movement-help"><kbd>WASD</kbd> move <span>·</span> <kbd>E</kbd> interact <span>·</span> <kbd>Esc</kbd> menu</div>
 {!safe&&<div className="fps-model-label">MODELED EXPOSURE · {player.radiationMsv.toFixed(3)} mSv</div>}
 {(!safe&&!e.suited||!safe&&e.oxygen<25||e.cycle>0||g.pendingEvent)&&<div className="fps-alarm" role="alert"><AlertTriangle size={16}/>{e.cycle>0?`Pressure cycle · ${Math.ceil(e.cycle)}s`:!safe&&!e.suited?'VACUUM · return to shelter':!safe&&e.oxygen<25?'LOW SUIT OXYGEN · return to airlock':'COLONY ALARM · check tablet'}</div>}
 {!e.panel&&e.pauseOpen&&!e.briefing&&<div className={`fps-pause ${e.locked||!e.pauseOpen||e.briefing?'is-hidden':''}`}><div>
  <header className="pause-heading"><span className="fps-eyebrow">MISSION CONTROL</span><h1>{e.ready?'Ares One':'Loading physics…'}</h1><CrewClock compact/></header>
  <p className="pause-controls">{e.activeRover?'W/S drive · A/D steer · Shift boost · Space brake · E exit':'WASD move · Mouse look · Shift sprint · E interact · M map'}</p>
  <button id="enter-astronaut" disabled={!e.ready||!player.alive}>{!player.alive?'Astronaut lost':e.activeRover?'Resume driving':'Explore on foot'}</button>
  {!e.activeRover&&<button id="deploy-rover" disabled={!e.ready||!player.alive||!e.rovers.length} onClick={()=>{const rover=e.rovers.find(r=>r.battery>1)??e.rovers[0];if(rover)e.boardRover(rover.id,true)}}>Start rover expedition</button>}
  <WeatherSkipControls onSkip={returnHome}/>
  <div className="pause-shortcuts"><button className="fps-secondary" onClick={()=>e.open({type:'tablet'})}>Tablet</button><button className="fps-secondary" onClick={()=>useTrainingUI.getState().show()}>Mission challenges</button></div>
  <details className="pause-options"><summary>Time &amp; environment</summary><CrewTimeControls/><button className="fps-secondary" onClick={()=>onPreview('surface')}>Surface weather · 720 sols</button><button className="fps-secondary" onClick={()=>onPreview('interior')}>Inspect reactor room</button></details>
  <details className="pause-options"><summary>Base &amp; colony views</summary><button className="fps-secondary" onClick={()=>e.returnToBase(l)}>Return to habitat</button><button className="fps-secondary" onClick={()=>e.modeTo('overview')}>Colony view</button></details>
  {!player.alive&&g.astronauts.filter(c=>c.alive).map(c=><button key={c.id} onClick={()=>{useExplorer.setState({playerId:c.id});e.modeTo('overview');e.modeTo('first-person')}}>Continue as {c.name}</button>)}
 </div></div>}

 {e.panel&&<div className="fps-panel-backdrop"><section className="fps-panel" role="dialog" aria-modal="true" aria-label="Astronaut equipment panel"><button className="fps-close" onClick={()=>e.open(null)} aria-label="Close tablet"><X size={20}/></button>{e.panel.type==='repair'?<Repair key={e.panel.id} id={e.panel.id!}/>:e.panel.type==='terminal'?<EquipmentPanel key={e.panel.id} id={e.panel.id!}/>:e.panel.type==='crew'?<CrewConversation id={e.panel.id!}/>:<TabletPanel/>}</section></div>}
 {!e.locked&&!e.pauseOpen&&!e.panel&&!e.briefing&&<button id="enter-astronaut" className="base-resume" disabled={!e.ready}>Click to explore · Esc for Mission Control</button>}
 <MissionResults/>
 </div>;
}
export default function FirstPerson(){
 const trainingOpen=useTrainingUI(s=>s.open),briefing=useExplorer(s=>s.briefing);
 const buildings=useGame(s=>s.buildings),startFieldMission=useGame(s=>s.startFieldMission),locked=useExplorer(s=>s.locked),panel=useExplorer(s=>s.panel),[preview,setPreview]=useState<'surface'|'interior'|null>(null);
 const signature=buildings.map(b=>`${b.id}:${b.kind}:${b.x}:${b.z}`).join('|');const layout=useMemo(()=>makeLayout(buildings),[signature]);
 useEffect(()=>{startFieldMission();return()=>{document.exitPointerLock?.();useExplorer.setState({locked:false,panel:null,ready:false})}},[]);
 useEffect(()=>{if(briefing)setPreview(null)},[briefing]);
 if(preview)return <SurfacePreview layout={layout} interior={preview==='interior'} onClose={()=>setPreview(null)}/>;
 return <main className="first-person-game"><PhysicsBoundary><Canvas frameloop={trainingOpen?'never':'always'} shadows dpr={[1,1.5]} camera={{fov:72,near:.06,far:500,position:layout.spawn}} gl={{antialias:true}} onCreated={({gl})=>{gl.toneMappingExposure=.95}}><RenderBudget/>{profiling&&<FrameProbe/>}<color attach="background" args={[C.sky]}/><fog attach="fog" args={[C.fog,100,360]}/><MarsSky layout={layout}/><IndustrialLighting/><SuitReflections/><Suspense fallback={null}><Physics gravity={[0,-3.71,0]} timeStep={1/60} paused={!locked||!!panel||trainingOpen}><MarsExterior layout={layout}/><Base layout={layout}/><Astronaut layout={layout}/></Physics></Suspense></Canvas><FrameReadout/><HUD layout={layout} onPreview={view=>setPreview(view)}/></PhysicsBoundary></main>;
}
