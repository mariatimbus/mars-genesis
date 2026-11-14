import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useExplorer } from './store';
import { useGame } from '../store/game';
import { useTrainingUI } from '../training/ui';
import { bindMouseLook } from './mouseLook';
export function MouseLookControls(){
 const {camera,gl,invalidate}=useThree();
 useEffect(()=>bindMouseLook(camera,gl.domElement,{
  canCapture:()=>{const e=useExplorer.getState();return e.mode==='first-person'&&e.ready&&!e.panel&&!useTrainingUI.getState().open&&!!useGame.getState().astronauts.find(c=>c.id===e.playerId&&c.alive)},
  onCapture:captured=>useExplorer.getState().setLocked(captured),
  onError:()=>useExplorer.getState().notify('Mouse capture was interrupted. Click Explore on foot / Resume driving to try again.'),
  onChange:invalidate,
 }),[camera,gl,invalidate]);
 return null;
}
