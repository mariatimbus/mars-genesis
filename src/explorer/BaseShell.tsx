import { useLayoutEffect,useMemo,useRef } from 'react';
import { RigidBody,CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { CELL,FLOOR,cellKey,type Layout,type Point } from './layout';
import { INDUSTRIAL as C } from '../visuals/palette';
interface Part {position:Point;size:Point;rotation?:Point;solid?:boolean}
type Finish='floor'|'ceiling'|'wall'|'trim'|'window'|'strip'|'post';
/** Render repeated architecture in seven batches; physics retains each solid. */
export function shellParts(l:Layout){
 const groups:Record<Finish,Part[]>={floor:[],ceiling:[],wall:[],trim:[],window:[],strip:[],post:[]};
 for(const k of l.cells){const [ix,iz]=k.split(',').map(Number),x=ix*CELL,z=iz*CELL;
  groups.floor.push({position:[x,FLOOR-.18,z],size:[3,.36,3],solid:true});
  groups.ceiling.push({position:[x,FLOOR+3.3,z],size:[3,.2,3],solid:true});
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
   if(l.cells.has(cellKey(ix+dx,iz+dz)))continue;
   if(Math.abs(x-l.airlock.x)<.1&&Math.abs(z+dz*1.5-l.airlock.outerZ)<.1)continue;
   groups.wall.push({position:[x+dx*1.5,FLOOR+1.6,z+dz*1.5],size:dx?[.22,3.2,3]:[3,3.2,.22],solid:true});
   groups.window.push({position:[x+dx*1.37,FLOOR+1.6,z+dz*1.37],size:[1.8,.75,1],rotation:[0,dx?Math.PI/2:0,0]});
   groups.trim.push({position:[x+dx*1.38,FLOOR+.35,z+dz*1.38],size:dx?[.06,.12,3]:[3,.12,.06],solid:true});
   groups.strip.push({position:[x+dx*1.36,FLOOR+2.9,z+dz*1.36],size:dx?[.06,.07,2.5]:[2.5,.07,.06]});
   for(const side of [-1,1])groups.post.push({position:[x+dx*1.36+(dx?0:side*1.4),FLOOR+1.65,z+dz*1.36+(dz?0:side*1.4)],size:[.12,3,.12]});
  }
 }return groups;
}
function Batch({parts,finish,texture}:{parts:Part[];finish:Finish;texture?:THREE.Texture}){
 const mesh=useRef<THREE.InstancedMesh>(null);
 useLayoutEffect(()=>{const object=new THREE.Object3D();parts.forEach((p,i)=>{object.position.set(...p.position);object.rotation.set(...(p.rotation??[0,0,0]));object.scale.set(...p.size);object.updateMatrix();mesh.current?.setMatrixAt(i,object.matrix)});if(mesh.current){mesh.current.instanceMatrix.needsUpdate=true;mesh.current.computeBoundingSphere()}},[parts]);
 const color={floor:'#c4c7d3',ceiling:C.dark,wall:'#d0d3df',trim:C.burgundy,window:'#171f36',strip:'#7981a0',post:C.burgundy}[finish];
 return <instancedMesh ref={mesh} args={[undefined,undefined,parts.length]} castShadow={finish!=='window'&&finish!=='strip'} receiveShadow>
  {finish==='window'?<planeGeometry args={[1,1]}/>:<boxGeometry args={[1,1,1]}/>}
  {finish==='strip'?<meshBasicMaterial color={color}/>:<meshStandardMaterial color={color} map={texture} roughness={finish==='window'?.15:finish==='post'?.45:.78} metalness={finish==='window'||finish==='post'?.65:.25}/>}
 </instancedMesh>;
}
export function BaseShell({layout,floorMap,wallMap}:{layout:Layout;floorMap:THREE.Texture;wallMap:THREE.Texture}){
 const groups=useMemo(()=>shellParts(layout),[layout]);
 return <><RigidBody type="fixed" colliders={false}>{Object.values(groups).flat().filter(p=>p.solid).map((p,i)=><CuboidCollider key={i} position={p.position} args={[p.size[0]/2,p.size[1]/2,p.size[2]/2]}/>)}</RigidBody>{(Object.keys(groups) as Finish[]).map(finish=><Batch key={finish} parts={groups[finish]} finish={finish} texture={finish==='floor'?floorMap:finish==='wall'?wallMap:undefined}/>)}</>;
}
