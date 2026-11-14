import { describe,it,expect,vi } from 'vitest';
import { PerspectiveCamera } from 'three';
import { bindMouseLook } from './mouseLook';
function setup(){
 const doc=Object.assign(new EventTarget(),{pointerLockElement:null as unknown,defaultView:new EventTarget(),exitPointerLock:vi.fn()}),camera=new PerspectiveCamera(),onCapture=vi.fn(),onError=vi.fn();let allowed=true;
 const canvas={ownerDocument:doc,requestPointerLock:vi.fn(()=>{doc.pointerLockElement=canvas;doc.dispatchEvent(new Event('pointerlockchange'));return Promise.resolve()})};
 doc.exitPointerLock.mockImplementation(()=>{doc.pointerLockElement=null;doc.dispatchEvent(new Event('pointerlockchange'))});
 const mount=()=>bindMouseLook(camera,canvas as unknown as HTMLCanvasElement,{canCapture:()=>allowed,onCapture,onError});
 const click=(disabled=false)=>{const event=new Event('click');Object.defineProperties(event,{target:{value:{closest:()=>({disabled})}},button:{value:0}});doc.dispatchEvent(event)};
 const move=(x:number,y:number)=>{const event=new Event('mousemove');Object.defineProperties(event,{movementX:{value:x},movementY:{value:y}});doc.dispatchEvent(event)};
 return {doc,camera,canvas,onCapture,onError,mount,click,move,block:()=>{allowed=false}};
}
describe('mouse capture across menus and remounts',()=>{
 it('only rotates the view after the browser confirms capture',()=>{
  const s=setup(),cleanup=s.mount(),initial=s.camera.quaternion.clone();s.move(100,40);expect(s.camera.quaternion.equals(initial)).toBe(true);
  s.click();expect(s.onCapture).toHaveBeenLastCalledWith(true);s.move(100,40);expect(s.camera.quaternion.angleTo(initial)).toBeGreaterThan(.1);cleanup();
 });
 it('accepts replacement resume buttons after tablet close and StrictMode reconnect',()=>{
  const s=setup();const first=s.mount();s.click();first();expect(s.doc.pointerLockElement).toBeNull();const cleanup=s.mount();
  s.click();s.doc.exitPointerLock();s.click();expect(s.canvas.requestPointerLock).toHaveBeenCalledTimes(3);expect(s.onCapture).toHaveBeenLastCalledWith(true);cleanup();
 });
 it('keeps training sliders and disabled controls from capturing the mouse',()=>{
  const s=setup(),cleanup=s.mount();s.click(true);expect(s.canvas.requestPointerLock).not.toHaveBeenCalled();s.block();s.click();expect(s.canvas.requestPointerLock).not.toHaveBeenCalled();cleanup();
 });
 it('stops mouse look immediately when a panel opens or the window loses focus',()=>{
  const s=setup(),cleanup=s.mount();s.click();s.move(20,5);const q=s.camera.quaternion.clone();s.block();s.move(60,30);expect(s.camera.quaternion.equals(q)).toBe(true);
  s.doc.defaultView.dispatchEvent(new Event('blur'));expect(s.onCapture).toHaveBeenLastCalledWith(false);expect(s.doc.pointerLockElement).toBeNull();cleanup();
 });
 it('handles rejected capture without leaving movement active, and permits a retry',async()=>{
  const s=setup(),cleanup=s.mount();s.canvas.requestPointerLock.mockImplementationOnce(()=>Promise.reject(new Error('Browser rejected capture')));s.click();await Promise.resolve();expect(s.onError).toHaveBeenCalledTimes(1);expect(s.onCapture).toHaveBeenLastCalledWith(false);
  s.click();expect(s.onCapture).toHaveBeenLastCalledWith(true);cleanup();
 });
 it('clamps vertical look and removes document handlers on unmount',()=>{
  const s=setup(),cleanup=s.mount();s.click();s.move(0,10000);expect(s.camera.rotation.x).toBeGreaterThan(-Math.PI/2);const q=s.camera.quaternion.clone();cleanup();s.click();s.move(50,20);expect(s.camera.quaternion.equals(q)).toBe(true);expect(s.canvas.requestPointerLock).toHaveBeenCalledTimes(1);
 });
});
