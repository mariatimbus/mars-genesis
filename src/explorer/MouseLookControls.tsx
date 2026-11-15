import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useExplorer } from './store';
import { useGame } from '../store/game';
import { useTrainingUI } from '../training/ui';
import { bindMouseLook } from './mouseLook';
export function MouseLookControls(){
 const {camera,gl,invalidate}=useThree();
 useEffect(()=>bindMouseLook(camera,gl.domElement,{
  canCapture:()=>{const e=useExplorer.getState();return e.mode==='first-person'&&e.ready&&!e.briefing&&!e.panel&&!useTrainingUI.getState().open&&!!useGame.getState().astronauts.find(c=>c.id===e.playerId&&c.alive)},
  onEscape:()=>{const e=useExplorer.getState();if(useTrainingUI.getState().open||e.briefing)return;if(e.panel){e.open(null);return;}if(e.pauseOpen){useExplorer.setState({pauseOpen:false})}else useExplorer.setState({pauseOpen:true})},
  onCapture:captured=>useExplorer.getState().setLocked(captured),
  onError:()=>useExplorer.getState().notify('Mouse capture was interrupted. Click Explore on foot / Resume driving to try again.'),
  onChange:invalidate,
 }),[camera,gl,invalidate]);
 return null;
}
