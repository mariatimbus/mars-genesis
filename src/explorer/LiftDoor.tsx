import { useMemo,useLayoutEffect,useRef,type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody,CuboidCollider,useBeforePhysicsStep,type RapierCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { Bulkhead,HazardStrip } from '../visuals/IndustrialKit';
import { INDUSTRIAL as C } from '../visuals/palette';
import { FLOOR,type Door } from './layout';
import { DOOR_WIDTH,DOOR_HEIGHT,DOOR_SLATS,DOOR_SLAT_HEIGHT,doorSlatPose,doorPassable } from './doorMechanics';

export function LiftDoor({door:d,opened,children}:{door:Door;opened:boolean;children?:ReactNode}){
 const progress=useRef(opened?1:0),slats=useRef<THREE.InstancedMesh>(null),panels=useRef<THREE.InstancedMesh>(null),collider=useRef<RapierCollider>(null);
 const color=opened?'#73caff':'#ffbf73';
 useBeforePhysicsStep(()=>{collider.current?.setEnabled(!opened||!doorPassable(progress.current))});
 const object=useMemo(()=>new THREE.Object3D(),[]);
 const updateSlats=()=>{
  for(let i=0;i<DOOR_SLATS;i++){const p=doorSlatPose(i,progress.current);object.position.set(0,p.y,p.z);object.updateMatrix();slats.current?.setMatrixAt(i,object.matrix);let j=0;
   for(const side of [-1,1])for(const face of [-1,1]){object.position.set(side*.67,p.y,p.z+face*.082);object.updateMatrix();panels.current?.setMatrixAt(i*4+j++,object.matrix)}
  }
  for(const mesh of [slats.current,panels.current])if(mesh){mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere()}
 };
 useLayoutEffect(updateSlats,[]);
 useFrame((_,dt)=>{
  const previous=progress.current;progress.current=THREE.MathUtils.damp(previous,opened?1:0,9,Math.min(.1,dt));
  if(Math.abs(previous-progress.current)>1e-7)updateSlats();
 });
 return <group name={`ceiling-lift-door-${d.id}`} position={[d.x,FLOOR,d.z]} rotation={[0,d.axis==='x'?Math.PI/2:0,0]}>
  <Bulkhead width={2.9} height={2.94}/>
  {[-1,1].map(side=><group key={side}>
   <mesh position={[side*1.43,1.36,0]} castShadow><boxGeometry args={[.16,2.72,.38]}/><meshStandardMaterial color="#68717e" metalness={.6} roughness={.45}/></mesh>
   {[-1,1].map(face=><mesh key={face} position={[side*1.32,1.45,face*.215]}><boxGeometry args={[.035,2.25,.025]}/><meshBasicMaterial color={color} toneMapped={false}/></mesh>)}
   <mesh position={[side*1.24,2.75,0]} rotation={[0,0,-side*Math.PI/4]} castShadow><boxGeometry args={[.16,.43,.4]}/><meshStandardMaterial color={C.steel} metalness={.6} roughness={.5}/></mesh>
  </group>)}
  <mesh position={[0,2.99,0]} castShadow><boxGeometry args={[2.88,.44,.55]}/><meshStandardMaterial color="#586270" metalness={.6} roughness={.5}/></mesh>
  {[-1,1].map(face=><group key={face}>
   <mesh position={[0,3.16,face*.29]}><boxGeometry args={[2.1,.035,.025]}/><meshBasicMaterial color={color} toneMapped={false}/></mesh>
   <HazardStrip position={[0,2.795,face*.29]} size={[2.5,.055,.025]}/>
  </group>)}
  <instancedMesh ref={slats} args={[undefined,undefined,DOOR_SLATS]} castShadow receiveShadow><boxGeometry args={[DOOR_WIDTH,DOOR_SLAT_HEIGHT-.012,.15]}/><meshStandardMaterial color={d.airlock?'#606777':'#6e7887'} metalness={.55} roughness={.42}/></instancedMesh>
  <instancedMesh ref={panels} args={[undefined,undefined,DOOR_SLATS*4]}><boxGeometry args={[1.12,DOOR_SLAT_HEIGHT-.1,.025]}/><meshStandardMaterial color="#424d5f" metalness={.65} roughness={.5}/></instancedMesh>
  <RigidBody type="fixed" colliders={false}><CuboidCollider ref={collider} position={[0,DOOR_HEIGHT/2,0]} args={[DOOR_WIDTH/2,DOOR_HEIGHT/2,.11]}/></RigidBody>
  {children}
 </group>;
}
