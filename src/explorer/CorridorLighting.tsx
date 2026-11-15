import { useEffect,useLayoutEffect,useMemo,useRef,useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../store/game';
import { hasSurfaceIncidents } from '../weather/incidents';
import { alertPulse } from '../weather/alertState';
import { CELL,FLOOR,type Layout } from './layout';

/** Shared ceiling strips and four nearby, shadow-free lights. All fixtures sit
 * overhead; alert lighting never adds obstacles to the walkable corridors. */
export function CorridorLighting({layout:l}:{layout:Layout}){
 const active=useGame(hasSurfaceIncidents),mesh=useRef<THREE.InstancedMesh>(null),material=useRef<THREE.MeshBasicMaterial>(null);
 const lights=useRef<(THREE.PointLight|null)[]>([]),sample=useRef(Infinity);
 const [reduced,setReduced]=useState(false);
 useEffect(()=>{const query=window.matchMedia('(prefers-reduced-motion: reduce)'),update=()=>setReduced(query.matches);update();query.addEventListener('change',update);return()=>query.removeEventListener('change',update)},[]);
 const positions=useMemo(()=>[...l.hall].map(key=>{const [x,z]=key.split(',').map(Number);return new THREE.Vector3(x*CELL,FLOOR+3.13,z*CELL)}),[l]);
 useLayoutEffect(()=>{
  const object=new THREE.Object3D();object.rotation.x=-Math.PI/2;
  positions.forEach((p,i)=>{object.position.copy(p);object.updateMatrix();mesh.current?.setMatrixAt(i,object.matrix)});
  if(mesh.current){mesh.current.instanceMatrix.needsUpdate=true;mesh.current.computeBoundingSphere()}
 },[positions]);
 useEffect(()=>{sample.current=Infinity},[active,positions]);
 useFrame(({clock,camera},dt)=>{
  const pulse=alertPulse(clock.elapsedTime,reduced);
  if(material.current){material.current.color.set(active?'#ff180c':'#abb6d3');if(active)material.current.color.multiplyScalar(.65+pulse*1.8)}
  sample.current+=dt;
  if(sample.current>.3){
   sample.current=0;
   const nearest=active?[...positions].sort((a,b)=>a.distanceToSquared(camera.position)-b.distanceToSquared(camera.position)).slice(0,4):[];
   lights.current.forEach((light,i)=>{if(!light)return;light.visible=!!nearest[i]&&nearest[i].distanceToSquared(camera.position)<225;if(nearest[i])light.position.set(nearest[i].x,nearest[i].y-.3,nearest[i].z)});
  }
  lights.current.forEach(light=>{if(light)light.intensity=active?70*pulse:0});
 });
 return <group name="corridor-alert-lighting"><instancedMesh ref={mesh} args={[undefined,undefined,positions.length]}><planeGeometry args={[.3,2]}/><meshBasicMaterial ref={material} color={active?'#ff180c':'#abb6d3'} side={THREE.DoubleSide} toneMapped={false}/></instancedMesh>{Array.from({length:4},(_,i)=><pointLight key={i} ref={node=>{lights.current[i]=node}} color="#ff291c" intensity={0} distance={8} decay={2}/>)}</group>;
}
