import { Moon, Sun } from 'lucide-react';
import { useCrewLife } from './crewStore';
import { habitatClock, nightShift } from './crewRoutine';
import './crew.css';
export function CrewClock(){const seconds=useCrewLife(s=>s.seconds),night=nightShift(seconds);return <div className={`crew-clock ${night?'is-night':''}`} aria-label={`Habitat time ${habitatClock(seconds)}`}><span>{night?<Moon size={14}/>:<Sun size={14}/>} HABITAT TIME</span><strong>{habitatClock(seconds)}</strong><small>{night?'Night rest · 22:00–06:00':'Day shift · lights out at 22:00'}</small></div>}
export function CrewTimeControls(){return <div className="crew-time-controls"><span>Observe the crew routine</span><div><button onClick={()=>useCrewLife.getState().setTime(22)}><Moon size={13}/> Lights out · 22:00</button><button onClick={()=>useCrewLife.getState().setTime(8)}><Sun size={13}/> Morning · 08:00</button></div><small>Resume exploration to watch them walk to their bunks or workstations. Mission sol stays unchanged.</small></div>}
