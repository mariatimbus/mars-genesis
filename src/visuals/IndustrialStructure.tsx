import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { CELL, FLOOR, cellKey, type Layout, type Point } from '../explorer/layout';
import { INDUSTRIAL as C } from './palette';
interface Segment {a:Point;b:Point;radius:number;color:string}
function PipeInstances({segments,color}:{segments:Segment[];color:string}){
 const ref=useRef<THREE.InstancedMesh>(null);
 useLayoutEffect(()=>{const object=new THREE.Object3D(),up=new THREE.Vector3(0,1,0),direction=new THREE.Vector3();segments.forEach((p,i)=>{object.position.set((p.a[0]+p.b[0])/2,(p.a[1]+p.b[1])/2,(p.a[2]+p.b[2])/2);direction.set(p.b[0]-p.a[0],p.b[1]-p.a[1],p.b[2]-p.a[2]);object.scale.set(p.radius,direction.length(),p.radius);object.quaternion.setFromUnitVectors(up,direction.normalize());object.updateMatrix();ref.current?.setMatrixAt(i,object.matrix)});if(ref.current){ref.current.instanceMatrix.needsUpdate=true;ref.current.computeBoundingSphere()}},[segments]);
 return <instancedMesh ref={ref} args={[undefined,undefined,segments.length]} castShadow><cylinderGeometry args={[1,1,1,6]}/><meshStandardMaterial color={color} metalness={.45} roughness={.68}/></instancedMesh>;
}
/** All pipework is above 2.6 m. The existing walkable geometry stays clear. */
export function IndustrialStructure({layout:l}:{layout:Layout}){
 const segments=useMemo(()=>{const result:Segment[]=[];
  for(const key of l.cells){const [ix,iz]=key.split(',').map(Number),x=ix*CELL,z=iz*CELL;
   for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]])if(!l.cells.has(cellKey(ix+dx,iz+dz))){
    for(let i=0;i<3;i++){const y=FLOOR+2.6+i*.13,tx=dz?1:0,tz=dx?1:0,cx=x+dx*1.32,cz=z+dz*1.32;result.push({a:[cx-tx*1.48,y,cz-tz*1.48],b:[cx+tx*1.48,y,cz+tz*1.48],radius:i===1?.037:.026,color:i===1?C.burgundy:C.cable})}
   }
   if(l.hall.has(key)){const alongX=l.cells.has(cellKey(ix+1,iz))||l.cells.has(cellKey(ix-1,iz));for(let i=0;i<2;i++)result.push({a:alongX?[x-1.5,FLOOR+3.05,z-.72-i*.13]:[x-.72-i*.13,FLOOR+3.05,z-1.5],b:alongX?[x+1.5,FLOOR+3.05,z-.72-i*.13]:[x-.72-i*.13,FLOOR+3.05,z+1.5],radius:.035,color:i?C.burgundy:C.cable})}
  }return result;
 },[l]);
 const burgundy=useMemo(()=>segments.filter(s=>s.color===C.burgundy),[segments]),cable=useMemo(()=>segments.filter(s=>s.color===C.cable),[segments]);
 return <><PipeInstances segments={burgundy} color={C.burgundy}/><PipeInstances segments={cable} color={C.cable}/></>;
}
