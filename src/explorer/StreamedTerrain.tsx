import { memo, useEffect, useLayoutEffect, useMemo } from 'react';
import { RigidBody, TrimeshCollider, useRapier } from '@react-three/rapier';
import * as THREE from 'three';
import type { Layout, Point } from './layout';
import type { LandPlot } from '../game/worldConfig';
import { useExplorer } from './store';
import { terrainHeight } from './fixtures';
import { CHUNK_SIZE, visibleTiles, registerGround, planetDirection, nearbyLandmarks } from './planet';

export function chunkData(l:Layout,plots:LandPlot[],cx:number,cz:number,segments:number){
 const positions:number[]=[],colors:number[]=[],uv:number[]=[],indices:number[]=[];
 for(let z=0;z<=segments;z++)for(let x=0;x<=segments;x++){
  const lx=x/segments*CHUNK_SIZE,lz=z/segments*CHUNK_SIZE,wx=cx*CHUNK_SIZE+lx,wz=cz*CHUNK_SIZE+lz,h=terrainHeight(l,wx,wz,plots),polar=Math.abs(planetDirection(wx,wz)[1]);
  positions.push(lx,h,lz);uv.push(wx/450+.5,wz/450+.5);
  const rock=.85+.1*Math.sin(wx*.13+wz*.07),c=new THREE.Color(polar>.95?'#c6bdb0':h>150?'#514955':'#92634e').multiplyScalar(rock);colors.push(c.r,c.g,c.b);
  if(x<segments&&z<segments){const a=z*(segments+1)+x,b=a+segments+1;indices.push(a,b,a+1,b,b+1,a+1)}
 }
 // Render-only skirts cover transitions between near and distant terrain LODs.
 const edge:number[]=[];
 for(let x=0;x<=segments;x++)edge.push(x);
 for(let z=1;z<=segments;z++)edge.push(z*(segments+1)+segments);
 for(let x=segments-1;x>=0;x--)edge.push(segments*(segments+1)+x);
 for(let z=segments-1;z>0;z--)edge.push(z*(segments+1));
 const surfaceIndices=indices.slice();
 edge.forEach((id,i)=>{const next=edge[(i+1)%edge.length],bottom=positions.length/3;positions.push(positions[id*3],positions[id*3+1]-10,positions[id*3+2],positions[next*3],positions[next*3+1]-10,positions[next*3+2]);colors.push(...colors.slice(id*3,id*3+3),...colors.slice(next*3,next*3+3));uv.push(uv[id*2],uv[id*2+1],uv[next*2],uv[next*2+1]);indices.push(id,bottom,next,next,bottom,bottom+1)});
 return {positions:new Float32Array(positions),colors:new Float32Array(colors),uv:new Float32Array(uv),indices,surfaceIndices};
}
const TerrainTile=memo(function TerrainTile({l,plots,x,z,segments,physics,material}:{l:Layout;plots:LandPlot[];x:number;z:number;segments:number;physics:boolean;material:THREE.Material}){
 const {world}=useRapier();
 const {geometry,vertices,indices}=useMemo(()=>{
  const d=chunkData(l,plots,x,z,segments),g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(d.positions,3));g.setAttribute('color',new THREE.BufferAttribute(d.colors,3));g.setAttribute('uv',new THREE.BufferAttribute(d.uv,2));g.setIndex(d.indices);g.computeVertexNormals();
  // Skirts must not pull the surface normals down at chunk edges. Sample the
  // same world-space gradient for every LOD so neighbouring tiles share light.
  const normals=g.getAttribute('normal'),normal=new THREE.Vector3(),epsilon=2.5;
  for(let row=0;row<=segments;row++)for(let col=0;col<=segments;col++){
   if(row!==0&&row!==segments&&col!==0&&col!==segments)continue;
   const wx=x*CHUNK_SIZE+col/segments*CHUNK_SIZE,wz=z*CHUNK_SIZE+row/segments*CHUNK_SIZE;
   normal.set(terrainHeight(l,wx-epsilon,wz,plots)-terrainHeight(l,wx+epsilon,wz,plots),2*epsilon,terrainHeight(l,wx,wz-epsilon,plots)-terrainHeight(l,wx,wz+epsilon,plots)).normalize();
   normals.setXYZ(row*(segments+1)+col,normal.x,normal.y,normal.z);
  }
  return {geometry:g,vertices:d.positions,indices:new Uint32Array(d.surfaceIndices)};
 },[l,plots,x,z,segments]);
 useLayoutEffect(()=>physics?registerGround(world,`${x},${z}`):undefined,[world,x,z,physics]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 return <group position={[x*CHUNK_SIZE,0,z*CHUNK_SIZE]}><mesh geometry={geometry} material={material} receiveShadow/>{physics&&<RigidBody type="fixed" colliders={false}><TrimeshCollider args={[vertices,indices]}/></RigidBody>}</group>;
});
export function StreamedTerrain({layout:l,plots,texture,focus}:{layout:Layout;plots:LandPlot[];texture:THREE.Texture;focus?:Point}){
 const position=useExplorer(s=>s.position),x=focus?.[0]??position[0],z=focus?.[2]??position[2],cx=Math.floor(x/CHUNK_SIZE),cz=Math.floor(z/CHUNK_SIZE);
 const tiles=useMemo(()=>visibleTiles(cx*CHUNK_SIZE,cz*CHUNK_SIZE),[cx,cz]);
 const material=useMemo(()=>new THREE.MeshStandardMaterial({vertexColors:true,map:texture,bumpMap:texture,bumpScale:.055,roughness:1}),[texture]);
 useEffect(()=>()=>material.dispose(),[material]);
 return <>{tiles.map(t=><TerrainTile key={`${t.x}:${t.z}:${t.segments}`} l={l} plots={plots} material={material} {...t}/>)}</>;
}
