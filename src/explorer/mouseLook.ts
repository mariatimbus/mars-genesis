import { Euler, type Camera } from 'three';
export interface MouseLookOptions {
 canCapture:()=>boolean;
 onCapture:(captured:boolean)=>void;
 onError:()=>void;
 onChange?:()=>void;
}
/** Delegate resume clicks: tablet/preview transitions replace the actual DOM buttons. */
export function bindMouseLook(camera:Camera,canvas:HTMLCanvasElement,options:MouseLookOptions){
 const doc=canvas.ownerDocument,view=doc.defaultView,euler=new Euler(0,0,0,'YXZ');
 let connected=true,pending=false;
 const fail=()=>{if(!connected)return;pending=false;options.onCapture(false);options.onError()};
 const changed=()=>{
  pending=false;const captured=doc.pointerLockElement===canvas;
  if(captured&&!options.canCapture()){doc.exitPointerLock?.();options.onCapture(false);return;}
  options.onCapture(captured);
 };
 const move=(event:MouseEvent)=>{
  if(doc.pointerLockElement!==canvas||!options.canCapture()||!Number.isFinite(event.movementX)||!Number.isFinite(event.movementY))return;
  euler.setFromQuaternion(camera.quaternion,'YXZ');
  euler.y-=event.movementX*.002;euler.x=Math.max(-Math.PI/2+.15,Math.min(Math.PI/2-.15,euler.x-event.movementY*.002));
  camera.quaternion.setFromEuler(euler);options.onChange?.();
 };
 const resume=(event:MouseEvent)=>{
  const button=(event.target as Element|null)?.closest?.<HTMLButtonElement>('#enter-astronaut,#deploy-rover');
  if(!button||button.disabled||event.button>0||!options.canCapture()||pending)return;
  if(doc.pointerLockElement===canvas){changed();return;}
  if(typeof canvas.requestPointerLock!=='function'){fail();return;}
  // Call inside the real click gesture; do not optimistically mark the game as locked.
  pending=true;
  try{const request=canvas.requestPointerLock();request?.catch(fail)}catch{fail()}
 };
 const blur=()=>{options.onCapture(false);if(doc.pointerLockElement===canvas)doc.exitPointerLock?.()};
 doc.addEventListener('click',resume);doc.addEventListener('mousemove',move);doc.addEventListener('pointerlockchange',changed);doc.addEventListener('pointerlockerror',fail);view?.addEventListener('blur',blur);
 changed();
 return ()=>{connected=false;doc.removeEventListener('click',resume);doc.removeEventListener('mousemove',move);doc.removeEventListener('pointerlockchange',changed);doc.removeEventListener('pointerlockerror',fail);view?.removeEventListener('blur',blur);if(doc.pointerLockElement===canvas)doc.exitPointerLock?.();options.onCapture(false)};
}
