import { useMemo, useState } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGame } from '../store/game';
import { elevation, type LandPlot } from './worldConfig';
function Parcel({plot,terrainPlots,selected}:{plot:LandPlot;terrainPlots:LandPlot[];selected:boolean}){
 const [hover,setHover]=useState(false);
 const choose=useGame(s=>s.chooseExpansion);
 const geometry=useMemo(()=>{
  const g=new THREE.PlaneGeometry(plot.maxX-plot.minX,plot.maxZ-plot.minZ,12,12);g.rotateX(-Math.PI/2);
  const p=g.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i)+(plot.minX+plot.maxX)/2,z=p.getZ(i)+(plot.minZ+plot.maxZ)/2;p.setXYZ(i,x,elevation(x,z,terrainPlots)+.16,z);}
  g.computeVertexNormals();return g;
 },[plot,terrainPlots]);
 const x=(plot.minX+plot.maxX)/2,z=(plot.minZ+plot.maxZ)/2;
 return <group><mesh geometry={geometry} onClick={e=>{e.stopPropagation();if(e.delta<5)choose(plot.id)}} onPointerOver={e=>{e.stopPropagation();setHover(true);document.body.style.cursor='pointer'}} onPointerOut={()=>{setHover(false);document.body.style.cursor='auto'}}>
 <meshBasicMaterial color={selected?'#e6ac6d':hover?'#a1e1cb':'#8ab9ab'} transparent opacity={selected?.5:hover?.32:.14} depthWrite={false} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={-2}/></mesh>
 {(selected||hover)&&<Html position={[x,elevation(x,z,terrainPlots)+1.6,z]} center style={{pointerEvents:'none'}}><div className="world-label">{selected?'PARCEL SELECTED':'SELECT THIS PARCEL'}</div></Html>}</group>
}
export function ExpansionPlots({plots,terrainPlots}:{plots:LandPlot[];terrainPlots:LandPlot[]}){
 const selected=useGame(s=>s.selectedPlot);
 return <>{plots.map(p=><Parcel key={p.id} plot={p} terrainPlots={terrainPlots} selected={selected===p.id}/>)}</>;
}
