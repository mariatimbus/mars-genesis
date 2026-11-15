import { useGame } from '../store/game';
import { useSurfaceWeather } from './store';
import { hasSystemLocks } from './incidents';

/** Explicit weather travel activates a scenario, including a previously visited
 * archive period. Slider previews remain harmless until the player travels. */
export function travelToSurfaceSol(sol:number){
 const g=useGame.getState(),w=useSurfaceWeather.getState();
 if(!Number.isFinite(sol)||g.status!=='playing'||g.pendingEvent||w.blocked||hasSystemLocks(g))return false;
 w.continueFrom(sol);
 // Explicit entry is also necessary for same-sol travel and restored saves:
 // a sol-change subscription alone cannot handle either case.
 useGame.getState().enterSurfaceSol(useSurfaceWeather.getState().sol,true);
 useSurfaceWeather.setState({blocked:hasSystemLocks(useGame.getState())});
 return true;
}
