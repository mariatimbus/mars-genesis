import { memo, useMemo, useRef, type RefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { EARTH_POSITION, EARTH_RADIUS, MARS_POSITION, MARS_RADIUS, LAUNCH_SURFACE, LANDING_SURFACE, LANDING_NORMAL, LAUNCH_NORMAL, flightPose, enginePower, clamp01 } from './flightPath';

function planetTexture(mars:boolean){
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;
 const ctx=canvas.getContext('2d')!;
 ctx.fillStyle=mars?'#945f4d':'#123e6e';ctx.fillRect(0,0,1024,512);
 let seed=mars?91:33;const rand=()=>{seed=seed*16807%2147483647;return seed/2147483647};
 if(!mars){
  // Original procedural illustration, not a NASA satellite image.
  const continents=[[[110,120],[190,65],[300,90],[345,158],[275,220],[190,210],[150,270],[105,230]],[[260,245],[340,270],[370,345],[325,430],[290,390]],[[475,105],[560,70],[610,115],[710,90],[850,145],[880,220],[790,250],[710,218],[645,260],[590,205],[555,160]],[[520,210],[620,220],[665,300],[600,375],[555,335]],[[810,335],[900,325],[930,375],[850,390]]];
  for(const poly of continents){ctx.beginPath();poly.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle='#65866b';ctx.fill();}
 }
 for(let i=0;i<8000;i++){const x=rand()*1024,y=rand()*512,r=rand()*(mars?13:7)+1;ctx.fillStyle=mars?(i%3?'#d1824930':'#652e2629'):(i%3?'#d6dec71b':'#0b345119');ctx.beginPath();ctx.ellipse(x,y,r*2,r,rand()*3,0,Math.PI*2);ctx.fill();}
 if(!mars){ctx.fillStyle='#edf4e738';for(let i=0;i<45;i++){const x=rand()*1024,y=rand()*512;ctx.beginPath();ctx.ellipse(x,y,30+rand()*80,8+rand()*15,-.35,0,Math.PI*1.3);ctx.fill();}}
 const cap=ctx.createLinearGradient(0,0,0,512);cap.addColorStop(0,mars?'#e9c7a7ad':'#e8f3f1e0');cap.addColorStop(.09,'#ffffff00');cap.addColorStop(.91,'#ffffff00');cap.addColorStop(1,mars?'#e9c7a7a0':'#e8f3f1d0');ctx.fillStyle=cap;ctx.fillRect(0,0,1024,512);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
function Planet({mars,position,scale,visible,reducedMotion}:{mars:boolean;position:[number,number,number];scale:number;visible:boolean;reducedMotion:boolean}){
 const mesh=useRef<THREE.Mesh>(null);const texture=useMemo(()=>planetTexture(mars),[mars]);
 useFrame((_,dt)=>{if(mesh.current&&!reducedMotion)mesh.current.rotation.y+=dt*(mars?.025:.035)});
 return <group position={position} scale={scale} visible={visible}><mesh ref={mesh} rotation={[.12,.7,.14]}><sphereGeometry args={[1,64,40]}/><meshStandardMaterial map={texture} roughness={.92}/></mesh><mesh scale={1.035}><sphereGeometry args={[1,48,32]}/><meshBasicMaterial color={mars?'#d98b62':'#71c3e7'} transparent opacity={.065} side={THREE.BackSide} depthWrite={false}/></mesh></group>
}
type FlightProps={progressRef:RefObject<number>;reducedMotion:boolean};
function Rocket({progressRef,reducedMotion}:FlightProps){
 const rocket=useRef<THREE.Group>(null),exhaust=useRef<THREE.Group>(null),boosters=useRef<THREE.Group>(null),wings=useRef<THREE.Group>(null),legs=useRef<THREE.Group>(null);
 const axis=useMemo(()=>new THREE.Vector3(0,1,0),[]),direction=useMemo(()=>new THREE.Vector3(),[]);
 useFrame(({clock})=>{
  const p=progressRef.current,pose=flightPose(p),burn=enginePower(p);
  if(rocket.current){rocket.current.scale.setScalar(.45+.2*clamp01((p-.18)/.1)-.2*clamp01((p-.72)/.18));rocket.current.position.set(...pose.position);rocket.current.quaternion.setFromUnitVectors(axis,direction.set(...pose.direction));}
  if(exhaust.current){exhaust.current.visible=burn>0;exhaust.current.scale.set(.7+burn*.3,burn*(reducedMotion?1:1+Math.sin(clock.elapsedTime*35)*.1),.7+burn*.3);}
  if(boosters.current){const drop=clamp01((p-.16)/.09);boosters.current.visible=drop<1;boosters.current.children.forEach((child,i)=>{child.position.set((i===0?-1:1)*(.52+drop*3),-drop*7,0);child.rotation.z=(i===0?1:-1)*drop*.8;});}
  if(wings.current)wings.current.scale.x=clamp01((p-.22)/.08);
  if(legs.current)legs.current.visible=p>.9;
 });
 return <group ref={rocket} scale={.45}>
 <mesh><cylinderGeometry args={[.31,.34,2.35,24]}/><meshStandardMaterial color="#8a90a6" metalness={.55} roughness={.3}/></mesh>
 <mesh position={[0,1.55,0]}><coneGeometry args={[.31,.75,24]}/><meshStandardMaterial color="#9b9eb0" metalness={.5} roughness={.3}/></mesh>
 <mesh position={[0,.8,.3]}><boxGeometry args={[.24,.43,.07]}/><meshStandardMaterial color="#173e54" metalness={.6} roughness={.2}/></mesh>
 {[-.85,.2].map(y=><mesh key={y} position={[0,y,0]}><cylinderGeometry args={[.345,.345,.12,24]}/><meshStandardMaterial color={y<0?'#454d52':'#643d50'} metalness={.7} roughness={.3}/></mesh>)}
 <mesh position={[0,-1.35,0]}><cylinderGeometry args={[.18,.29,.38,16]}/><meshStandardMaterial color="#4b575e" metalness={.8} roughness={.4}/></mesh>
 {[-1,1].map(side=><mesh key={side} position={[side*.32,-.9,0]} rotation={[0,0,side*-.35]}><boxGeometry args={[.13,.75,.42]}/><meshStandardMaterial color="#505d65" metalness={.5} roughness={.4}/></mesh>)}
 <group ref={boosters}>{[-1,1].map(side=><group key={side} position={[side*.52,0,0]}><mesh position={[0,-.25,0]}><cylinderGeometry args={[.17,.2,1.9,16]}/><meshStandardMaterial color="#686e86" metalness={.5} roughness={.5}/></mesh><mesh position={[0,.89,0]}><coneGeometry args={[.17,.4,16]}/><meshStandardMaterial color="#8b91a6"/></mesh><mesh position={[0,-1.3,0]}><cylinderGeometry args={[.12,.2,.25,16]}/><meshStandardMaterial color="#4b555a" metalness={.8}/></mesh></group>)}</group>
 <group ref={wings}>{[-1,1].map(side=><group key={side} position={[side*1.15,-.2,0]}><mesh><boxGeometry args={[1.6,.7,.045]}/><meshStandardMaterial color="#1c4675" metalness={.5} roughness={.35}/></mesh>{[-.6,-.2,.2,.6].map(x=><mesh key={x} position={[x,0,.028]}><boxGeometry args={[.018,.7,.01]}/><meshBasicMaterial color="#83a9bb"/></mesh>)}<mesh position={[0,0,.028]}><boxGeometry args={[1.6,.02,.01]}/><meshBasicMaterial color="#83a9bb"/></mesh></group>)}</group>
 <group ref={legs}>{[0,1,2,3].map(i=><group key={i} rotation={[0,i*Math.PI/2,0]}><mesh position={[.51,-1.26,0]} rotation={[0,0,-.5]}><cylinderGeometry args={[.025,.025,.9,8]}/><meshStandardMaterial color="#9ba6ab" metalness={.8}/></mesh><mesh position={[.72,-1.65,0]}><boxGeometry args={[.3,.04,.2]}/><meshStandardMaterial color="#5f6c72"/></mesh></group>)}</group>
 <group ref={exhaust} position={[0,-1.55,0]}><mesh position={[0,-1.1,0]} rotation={[Math.PI,0,0]}><coneGeometry args={[.28,2.2,20]}/><meshBasicMaterial color="#6ebce5" transparent opacity={.45} blending={THREE.AdditiveBlending} depthWrite={false}/></mesh><mesh position={[0,-.65,0]} rotation={[Math.PI,0,0]}><coneGeometry args={[.17,1.3,16]}/><meshBasicMaterial color="#fff2b6" transparent opacity={.9} blending={THREE.AdditiveBlending} depthWrite={false}/></mesh><pointLight color="#79caff" intensity={3} distance={5}/></group>
 </group>
}
function SurfaceParticles({progressRef,reducedMotion,landing=false}:FlightProps&{landing?:boolean}){
 const group=useRef<THREE.Group>(null);
 useFrame(()=>{if(!group.current)return;const p=progressRef.current;const t=landing?clamp01((p-.92)/.08):clamp01(p/.16);group.current.visible=!reducedMotion&&(landing?p>.92&&p<1:p<.16);group.current.children.forEach((obj,i)=>{const a=i*2.39996;const r=(.2+t*2)*(1+(i%4)*.2);obj.position.set(Math.cos(a)*r,.15+(i%3)*.15,Math.sin(a)*r);obj.scale.setScalar(.4+t*1.7);((obj as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity=(landing?.16:.23)*(1-t*.8);});});
 const q=useMemo(()=>new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(...(landing?LANDING_NORMAL:[.6,.8,.04])).normalize()),[landing]);
 return <group ref={group} position={landing?LANDING_SURFACE:LAUNCH_SURFACE} quaternion={q}>{Array.from({length:18},(_,i)=><mesh key={i}><sphereGeometry args={[.22,7,5]}/><meshBasicMaterial color={landing?'#b8835a':'#b6c3c4'} transparent opacity={.2} depthWrite={false}/></mesh>)}</group>
}
function FlightTrail({progressRef}:Pick<FlightProps,'progressRef'>){
 const geometry=useMemo(()=>new THREE.BufferGeometry().setFromPoints(Array.from({length:201},(_,i)=>new THREE.Vector3(...flightPose(i/200).position))),[]);
 const line=useMemo(()=>new THREE.Line(geometry,new THREE.LineBasicMaterial({color:"#70becd",transparent:true,opacity:.23,depthWrite:false})),[geometry]);
 useFrame(()=>geometry.setDrawRange(0,Math.max(1,Math.floor(progressRef.current*200)+1)));
 return <primitive object={line}/>
}
function LandingPad(){
 const quaternion=useMemo(()=>new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(...LANDING_NORMAL)),[]);
 return <group position={LANDING_SURFACE} quaternion={quaternion}><mesh><cylinderGeometry args={[1.1,1.15,.04,40]}/><meshStandardMaterial color="#697574" metalness={.4} roughness={.7}/></mesh><mesh rotation={[-Math.PI/2,0,0]} position={[0,.035,0]}><ringGeometry args={[.82,.86,48]}/><meshBasicMaterial color="#c7c2ad"/></mesh>{[0,1,2,3].map(i=><mesh key={i} position={[Math.cos(i*Math.PI/2)*1.1,.1,Math.sin(i*Math.PI/2)*1.1]}><sphereGeometry args={[.045,8,6]}/><meshBasicMaterial color="#87e0c9"/></mesh>)}</group>
}
function FlightCamera({progressRef,reducedMotion}:FlightProps){
 const target=useRef(new THREE.Vector3()),cameraPosition=useMemo(()=>new THREE.Vector3(),[]);
 const initialized=useRef(false);
 useFrame(({camera,size},dt)=>{
  const p=progressRef.current,pose=flightPose(p);
  const offset=p<.18?[7,4,11]:p<.72?[0,3,10]:[6,5,10];
  cameraPosition.set(pose.position[0]+offset[0],pose.position[1]+offset[1],pose.position[2]+offset[2]);
  const look=new THREE.Vector3(pose.position[0]-1.5,pose.position[1]-.6,pose.position[2]);
  const up=p<.18?new THREE.Vector3(...LAUNCH_NORMAL):new THREE.Vector3(0,1,0).lerp(new THREE.Vector3(...LANDING_NORMAL),clamp01((p-.78)/.14)).normalize();
  // Frame the ship beside the centered story, or above it on portrait screens.
  const forward=new THREE.Vector3().subVectors(look,cameraPosition).normalize();
  const right=new THREE.Vector3().crossVectors(forward,up).normalize();
  const portrait=size.width/size.height<1;
  look.addScaledVector(right,portrait?-.6:-3.4).addScaledVector(up,portrait?-3.5:-.6);
  const speed=!initialized.current||reducedMotion?1:1-Math.exp(-dt*3);
  camera.position.lerp(cameraPosition,speed);target.current.lerp(look,speed);
  camera.up.lerp(up,speed).normalize();camera.lookAt(target.current);initialized.current=true;
 });return null;
}
function Space(props:FlightProps){return <><color attach="background" args={['#050b13']}/><ambientLight intensity={.28}/><directionalLight position={[-10,20,30]} intensity={3.2} color="#fff0d5"/><Stars radius={100} depth={60} count={2400} factor={2.8} saturation={0} fade speed={0}/><Planet mars={false} position={EARTH_POSITION} scale={EARTH_RADIUS} visible={true} reducedMotion={props.reducedMotion}/><Planet mars={true} position={MARS_POSITION} scale={MARS_RADIUS} visible={true} reducedMotion={props.reducedMotion}/><FlightTrail progressRef={props.progressRef}/><Rocket {...props}/><SurfaceParticles {...props}/><SurfaceParticles {...props} landing/><LandingPad/><FlightCamera {...props}/></>}
const IntroSpaceScene=memo(function IntroSpaceScene(props:FlightProps){return <Canvas dpr={[1,1.5]} camera={{position:[-6,7,10],fov:45,near:.05,far:250}} gl={{alpha:false,antialias:true}}><Space {...props}/></Canvas>});
export default IntroSpaceScene;
