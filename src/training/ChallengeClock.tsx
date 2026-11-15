import { useEffect } from 'react';
import { useGame } from '../store/game';
import { useTrainingUI } from './ui';
import { useExplorer } from '../explorer/store';
import { needsChallengeClock } from './attempts';
/** Runs even during startup, weather maintenance and open challenge screens.
 * Pausing the game, hiding the tab or leaving the app pauses active-play time.
 */
export function ChallengeClock(){
 useEffect(()=>{
  let last=performance.now();const interval=setInterval(()=>{
   const now=performance.now(),delta=Math.min(.5,(now-last)/1000);last=now;
   const g=useGame.getState(),e=useExplorer.getState();
   if(g.prologueSeen&&g.status==='playing'&&!document.hidden&&document.hasFocus()&&(useTrainingUI.getState().open||e.locked||e.mode==='overview')&&needsChallengeClock(g))g.challengeTick(delta);
  },250);
  return()=>clearInterval(interval);
 },[]);return null;
}
