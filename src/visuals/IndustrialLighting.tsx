import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
/** One moving shadow-casting sun; fixture lighting supplies the interior contrast. */
export function IndustrialLighting(){
 const sun=useRef<THREE.DirectionalLight>(null);
 useFrame(({camera})=>{if(!sun.current)return;sun.current.position.set(camera.position.x-60,camera.position.y+100,camera.position.z-40);sun.current.target.position.copy(camera.position);sun.current.target.updateMatrixWorld()});
 return <><ambientLight intensity={.3} color="#9ba5cd"/><hemisphereLight args={['#9ba8d2','#47303b',.7]}/><directionalLight ref={sun} position={[-60,100,-40]} color="#ffe0b8" intensity={2.25} castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-100} shadow-camera-right={100} shadow-camera-top={100} shadow-camera-bottom={-100} shadow-camera-far={280} shadow-normalBias={.035}/></>;
}
