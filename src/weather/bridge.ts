import { useGame } from '../store/game';
import { useSurfaceWeather } from './store';
import { hasSystemLocks } from './incidents';
import { useCrewLife } from '../characters/crewStore';
/** Attach once in App. Previewing a sol never enters it or creates a fault. */
export function connectSurfaceIncidents(){
 const setBlocked=()=>{const blocked=hasSystemLocks(useGame.getState());if(useSurfaceWeather.getState().blocked!==blocked)useSurfaceWeather.setState({blocked})};
 const enter=()=>useGame.getState().enterSurfaceSol(useSurfaceWeather.getState().sol);
 const syncClock=()=>{const seconds=useSurfaceWeather.getState().seconds;if(useCrewLife.getState().seconds!==seconds)useCrewLife.setState(s=>({seconds,revision:s.revision+1}))};
 const stopWeather=useSurfaceWeather.subscribe((s,previous)=>{if(s.seconds!==previous.seconds||s.sol!==previous.sol)syncClock();if(s.sol!==previous.sol)enter()});
 const stopGame=useGame.subscribe((s,previous)=>{
  if(s.sol!==previous.sol||s.seed!==previous.seed)useSurfaceWeather.getState().syncMission(s.sol,s.seed);
  setBlocked();
 });
 const g=useGame.getState();useSurfaceWeather.getState().syncMission(g.sol,g.seed);syncClock();enter();setBlocked();
 return()=>{stopWeather();stopGame()};
}
