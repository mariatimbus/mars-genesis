import { Vector3 } from 'three';

export const heldKeys=new Set<string>();
export const MOVEMENT_CODES = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight', 'Space']);
export function movementInput(keys: Set<string>, forward: Vector3) {
  // Keep walking stable even when looking almost straight up or down.
  const heading = new Vector3(forward.x, 0, forward.z);
  if (heading.lengthSq() < .0001) heading.set(0, 0, -1);
  heading.normalize();
  const right = new Vector3().crossVectors(heading, new Vector3(0, 1, 0));
  const pressed = (a: string, b: string) => keys.has(a) || keys.has(b) ? 1 : 0;
  return heading.multiplyScalar(pressed('KeyW', 'ArrowUp') - pressed('KeyS', 'ArrowDown'))
    .addScaledVector(right, pressed('KeyD', 'ArrowRight') - pressed('KeyA', 'ArrowLeft')).normalize();
}
export function createWalker<C extends { enableAutostep(height:number,width:number,dynamic:boolean):void; enableSnapToGround(distance:number):void; setMaxSlopeClimbAngle(angle:number):void }>(world: {createCharacterController(offset:number):C}) {
  const controller = world.createCharacterController(.025);
  controller.enableAutostep(.3, .3, true);
  controller.enableSnapToGround(.25);
  controller.setMaxSlopeClimbAngle(Math.PI / 4);
  return controller;
}
