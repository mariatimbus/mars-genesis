import type { Point } from './layout';
export interface RoverState {id:string;name:string;position:Point;heading:number;battery:number;speed:number;odometer:number}
export const ROVER_CRUISE=18,ROVER_BOOST=32,ROVER_REVERSE=8;
export function driveStep(speed:number,heading:number,input:{throttle:number;steer:number;brake:boolean;boost:boolean;battery:number},dt:number){
 dt=Math.max(0,Math.min(.1,dt));
 const target=input.battery<=0||input.brake?0:input.throttle*(input.throttle<0?ROVER_REVERSE:input.boost?ROVER_BOOST:ROVER_CRUISE);
 const acceleration=input.brake?28:input.throttle===0?7:Math.sign(target)!==Math.sign(speed)&&Math.abs(speed)>.2?14:8;
 const next=speed+Math.max(-acceleration*dt,Math.min(acceleration*dt,target-speed));
 const steering=input.steer*Math.min(1,Math.abs(next)/3)*(next<0?-1:1)*(.9-Math.min(.4,Math.abs(next)/80));
 return {speed:next,heading:heading+steering*dt,distance:next*dt,battery:Math.max(0,input.battery-Math.abs(next)*dt*.0012)};
}
export function exitCandidates(rover:RoverState,height:(x:number,z:number)=>number):Point[]{
 const right=[Math.cos(rover.heading),Math.sin(rover.heading)];
 return [-1,1,-1,1].map((side,i)=>{const distance=i<2?3.2:4.5,x=rover.position[0]+right[0]*distance*side,z=rover.position[2]+right[1]*distance*side;return [x,height(x,z)+.96,z]});
}
