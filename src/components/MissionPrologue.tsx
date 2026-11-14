import { useEffect, useRef, useState, Component, type ReactNode } from 'react';
import { Play, Pause } from 'lucide-react';
import IntroSpaceScene from '../game/IntroSpaceScene';
import { PROLOGUE } from '../data/prologue';
import { useFlightPlayback } from '../hooks/useFlightPlayback';

class CinematicBoundary extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true}}
 render(){return this.state.failed?<div className="prologue-space-fallback"/>:this.props.children}
}

export function MissionPrologue({onComplete}:{onComplete:()=>void;continuing?:boolean}){
 const [reducedMotion]=useState(()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false);
 const flight=useFlightPlayback(false),staticProgress=useRef(0),completed=useRef(false);
 const chapter=Math.min(3,Math.floor(flight.progress*4)),current=PROLOGUE.chapters[chapter];
 useEffect(()=>{if(flight.progress>=1&&!completed.current){completed.current=true;onComplete()}},[flight.progress,onComplete]);
 const lines=['Four pioneers. One future.','210 days. Seven months from home.','A new world. A fragile beginning.','Keep your crew alive. Build humanity’s future.'];
 return <section className={`mission-story fast-intro mission-story--chapter-${chapter}`} lang="en" aria-label="The Genesis mission story" onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation()}}}>
  <div className="mission-story__visual" aria-hidden="true"><CinematicBoundary><IntroSpaceScene progressRef={reducedMotion?staticProgress:flight.progressRef} reducedMotion={reducedMotion}/></CinematicBoundary></div>
  <div className="mission-story__shade" aria-hidden="true"/>
  <header className="mission-story__header"><span className="mission-story__brand">MARS <span>/</span> GENESIS</span></header>
  <div className="mission-story__stage"><article className="mission-story__page" key={chapter} aria-live="polite"><h1>{current.title.split('\n').map((line,i)=><span key={line} className={i?'mission-story__title-soft':undefined}>{line}</span>)}</h1><div className="mission-story__body"><p>{lines[chapter]}</p></div></article></div>
  <footer className="mission-story__footer"><div className="intro-progress" role="progressbar" aria-label="Journey to Mars" aria-valuenow={Math.round(flight.progress*100)} aria-valuemin={0} aria-valuemax={100}><span style={{width:`${flight.progress*100}%`}}/></div><button className="mission-story__motion" onClick={flight.toggle} aria-label={flight.playing?'Pause introduction':'Resume introduction'}>{flight.playing?<Pause size={15}/>:<Play size={15}/>}</button></footer>
 </section>
}
