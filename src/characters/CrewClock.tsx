import { Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { habitatClock, nightShift } from './crewRoutine';
import { useSurfaceWeather } from '../weather/store';
import { nextTimeOfDay } from '../weather/timeOfDay';
import { useGame } from '../store/game';
import { hasSystemLocks } from '../weather/incidents';
import './crew.css';
export function CrewClock({compact=false}:{compact?:boolean}){const {seconds,sol}=useSurfaceWeather(),night=nightShift(seconds);return <div className={`crew-clock ${compact?'is-compact':''} ${night?'is-night':''}`} aria-label={`Habitat time ${habitatClock(seconds)}, sol ${sol}`} title={night?'Night rest · 22:00–06:00':'Day shift · lights out at 22:00'}><span>{night?<Moon size={14}/>:<Sun size={14}/>} {compact?'LOCAL TIME':'HABITAT TIME'}</span><strong>{habitatClock(seconds)}</strong><small>Sol {sol}{!compact&&` · ${night?'Night rest · 22:00–06:00':'Day shift · lights out at 22:00'}`}</small></div>}
export function CrewTimeControls(){
 const weather=useSurfaceWeather(),g=useGame(),[result,setResult]=useState('');
 const blocked=weather.blocked||hasSystemLocks(g),unavailable=blocked||g.status!=='playing'||!!g.pendingEvent;
 const skip=(hour:number)=>{
  if(unavailable)return;
  weather.skipToHour(hour);const actual=useSurfaceWeather.getState();
  setResult(`${actual.blocked?'Stopped for a system alert':'Time advanced'} · Sol ${actual.sol} · ${habitatClock(actual.seconds)}.`);
 };
 return <div className="crew-time-controls"><span>Skip ahead in time</span><div>{([{hour:22,label:'Lights out',Icon:Moon},{hour:8,label:'Morning',Icon:Sun}]).map(({hour,label,Icon})=>{
  const target=nextTimeOfDay(weather.sol,weather.seconds,hour);
  return <button key={hour} disabled={unavailable||!target} onClick={()=>skip(hour)}><Icon size={13}/> {label} · {String(hour).padStart(2,'0')}:00{target?` · Sol ${target.sol}`:''}</button>;
 })}</div><small>{blocked?'Repair the isolated systems before skipping time.':g.pendingEvent?'Resolve the colony alert before skipping time.':'Time moves forward. Passing midnight advances the surface sol; important events interrupt the skip.'} Resume exploration to watch the crew walk to their bunks or workstations.</small>{result&&<small role="status">{result}</small>}</div>;
}
