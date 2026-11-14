import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { INDUSTRIAL as C } from './palette';
import type { Point } from '../explorer/layout';

export function HazardStrip({position=[0,0,0],size=[1,.1,.025],rotation=[0,0,0]}:{position?:Point;size?:Point;rotation?:Point}){
 const texture=useMemo(()=>{const canvas=document.createElement('canvas');canvas.width=256;canvas.height=32;const ctx=canvas.getContext('2d')!;ctx.fillStyle=C.dark;ctx.fillRect(0,0,256,32);ctx.fillStyle=C.yellow;for(let x=-32;x<288;x+=48){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+24,0);ctx.lineTo(x-8,32);ctx.lineTo(x-32,32);ctx.closePath();ctx.fill()}const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;return t},[]);
 useEffect(()=>()=>texture.dispose(),[texture]);
 return <mesh position={position} rotation={rotation}><boxGeometry args={size}/><meshStandardMaterial map={texture} roughness={.78} metalness={.12}/></mesh>;
}
export function Pipe({points,radius=.035,color=C.burgundy}:{points:Point[];radius?:number;color?:string}){
 const curve=useMemo(()=>{const path=new THREE.CurvePath<THREE.Vector3>();for(let i=1;i<points.length;i++)path.add(new THREE.LineCurve3(new THREE.Vector3(...points[i-1]),new THREE.Vector3(...points[i])));return path},[points]);
 return <mesh castShadow><tubeGeometry args={[curve,Math.max(8,points.length*3),radius,6,false]}/><meshStandardMaterial color={color} metalness={.45} roughness={.65}/></mesh>;
}
export function Bulkhead({width=2.7,height=3.05,position=[0,0,0],rotation=[0,0,0]}:{width?:number;height?:number;position?:Point;rotation?:Point}){
 const points:Point[]=[[-width/2,0,0],[-width/2,height-.5,0],[-width/2+.5,height,0],[width/2-.5,height,0],[width/2,height-.5,0],[width/2,0,0]];
 return <group position={position} rotation={rotation}>
  <Pipe points={points} radius={.07} color={C.steel}/>
  {[-.13,.13].map(z=><Pipe key={z} points={points.map(([x,y])=>[x,y,z])} radius={.045} color={C.burgundy}/>)}
  {[-1,1].map(side=><group key={side}><HazardStrip position={[side*(width/2-.18),height-.6,.08]} size={[.36,.11,.06]} rotation={[0,0,side*Math.PI/4]}/><mesh position={[side*(width/2-.12),.2,.04]}><boxGeometry args={[.17,.25,.12]}/><meshStandardMaterial color={C.dark} metalness={.4} roughness={.7}/></mesh></group>)}
 </group>;
}
export function CRTMonitor({title,status='STANDBY',lines=[],schematic=false,width=1.1,height=.76,position=[0,0,0]}:{title:string;status?:string;lines?:string[];schematic?:boolean;width?:number;height?:number;position?:Point}){
 const texture=useMemo(()=>{const canvas=document.createElement('canvas');canvas.width=512;canvas.height=320;const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t},[]);
 const signature=lines.join('|');
 useEffect(()=>{
  const c=texture.image as HTMLCanvasElement,ctx=c.getContext('2d')!;ctx.setTransform(512/768,0,0,320/512,0,0);ctx.fillStyle=C.screen;ctx.fillRect(0,0,768,512);
  ctx.textBaseline='top';ctx.font='bold 25px monospace';ctx.fillStyle=C.green;ctx.fillText(title.toUpperCase().slice(0,35),28,24);
  ctx.font='19px monospace';ctx.fillStyle=status==='ONLINE'?C.green:C.yellow;ctx.fillText(`STATUS / ${status}`,28,61);ctx.strokeStyle='#42654a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(28,90);ctx.lineTo(740,90);ctx.stroke();
  if(schematic){
   ctx.strokeStyle=C.blue;ctx.lineWidth=2;for(let i=0;i<4;i++){const x=42+i*172;ctx.strokeRect(x,145,134,160);ctx.strokeRect(x+10,156,114,30);ctx.beginPath();ctx.moveTo(x+64,117);ctx.lineTo(x+64,145);ctx.moveTo(x+64,305);ctx.lineTo(x+64,340);ctx.stroke();ctx.fillStyle=C.green;ctx.font='15px monospace';ctx.fillText(['POWER','LIFE SUPPORT','THERMAL','RECYCLING'][i],x+10,210);ctx.strokeStyle=C.green;ctx.beginPath();ctx.arc(x+65,266,19,0,Math.PI*2);ctx.stroke();ctx.strokeStyle=C.blue}
   ctx.strokeStyle=C.blue;ctx.beginPath();ctx.moveTo(20,117);ctx.lineTo(738,117);ctx.moveTo(20,340);ctx.lineTo(738,340);ctx.stroke();
   ctx.font='18px monospace';ctx.fillStyle=C.green;lines.slice(0,3).forEach((line,i)=>ctx.fillText(line.slice(0,58),28,375+i*27));
  }else{
   ctx.font='22px monospace';lines.slice(0,8).forEach((line,i)=>{ctx.fillStyle=i%3===0?C.green:'#78a985';ctx.fillText(line.slice(0,53),28,113+i*36)});
   for(let i=0;i<9;i++){ctx.fillStyle=i<6?C.green:'#244329';ctx.fillRect(30+i*75,422,59,10)}
  }
  ctx.font='15px monospace';ctx.fillStyle=C.blue;ctx.fillText('ARES SYSTEMS  /  GENESIS-OS 01',28,476);ctx.fillStyle=C.green;ctx.fillText('[E] ACCESS',605,476);
  // Thin scanlines remain part of the display, never a blur over the game view.
  ctx.fillStyle='#00000024';for(let y=0;y<512;y+=4)ctx.fillRect(0,y,768,1);texture.needsUpdate=true;
 },[texture,title,status,signature,schematic]);
 useEffect(()=>()=>texture.dispose(),[texture]);
 return <group position={position}>
  <mesh castShadow><boxGeometry args={[width,height,.22]}/><meshStandardMaterial color={C.steel} roughness={.62} metalness={.25}/></mesh>
  <mesh position={[0,0,.114]}><boxGeometry args={[width-.08,height-.08,.04]}/><meshStandardMaterial color={C.dark} roughness={.9}/></mesh>
  <mesh position={[0,.015,.14]}><planeGeometry args={[width-.14,height-.15]}/><meshBasicMaterial map={texture} toneMapped={false}/></mesh>
  {[-1,1].map(side=><mesh key={side} position={[side*(width/2-.035),height/2-.035,.13]}><cylinderGeometry args={[.012,.012,.01,6]}/><meshStandardMaterial color={C.dark}/></mesh>)}
  {[0,1,2,3,4].map(i=><mesh key={i} position={[width*.22+i*.037,-height/2+.04,.133]}><boxGeometry args={[.022,.012,.012]}/><meshBasicMaterial color={i===4?C.yellow:C.green} toneMapped={false}/></mesh>)}
 </group>;
}
export function Reactor({radius=1,depth=.65,active=false}:{radius?:number;depth?:number;active?:boolean}){
 const rotor=useRef<THREE.Group>(null);
 useFrame((_,dt)=>{if(rotor.current&&active)rotor.current.rotation.z+=Math.min(dt,.05)*.35});
 return <group>
  <mesh rotation={[Math.PI/2,0,0]} castShadow><cylinderGeometry args={[radius*.95,radius*.95,depth,12]}/><meshStandardMaterial color={C.dark} metalness={.6} roughness={.6}/></mesh>
  {[-depth/2,depth/2].map((z,i)=><group key={i} position={[0,0,z]}>
   {[1,.86,.7].map((scale,j)=><mesh key={j} castShadow><torusGeometry args={[radius*scale,radius*(j===0?.055:.027),6,24]}/><meshStandardMaterial color={j===1?C.burgundy:C.steel} metalness={.5} roughness={.65}/></mesh>)}
   {Array.from({length:12},(_,j)=>{const a=j*Math.PI/6;return <mesh key={j} position={[Math.cos(a)*radius*.88,Math.sin(a)*radius*.88,.014]} rotation={[0,0,a]}><boxGeometry args={[radius*.07,radius*.12,.06]}/><meshStandardMaterial color={j%3===0?C.yellow:C.dark} roughness={.8}/></mesh>})}
  </group>)}
  <group ref={rotor} position={[0,0,depth/2+.04]}>
   {Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;return <group key={i} rotation={[0,0,a]}><mesh position={[0,radius*.43,0]} rotation={[.25,.1,.35]} castShadow><boxGeometry args={[radius*.2,radius*.58,radius*.13]}/><meshStandardMaterial color={i%2?C.panel:C.cable} metalness={.45} roughness={.55}/></mesh></group>})}
   <mesh rotation={[Math.PI/2,0,0]} castShadow><cylinderGeometry args={[radius*.28,radius*.3,.15,8]}/><meshStandardMaterial color={C.burgundy} metalness={.5}/></mesh>
   <mesh position={[0,0,.09]}><torusGeometry args={[radius*.18,.02,4,12]}/><meshBasicMaterial color={active?C.green:C.yellow} toneMapped={false}/></mesh>
   <mesh position={[0,0,.12]}><circleGeometry args={[radius*.085,8]}/><meshStandardMaterial color={C.steel} metalness={.65}/></mesh>
  </group>
 </group>;
}
