import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { surfaceWeather } from '../weather/calendar';
import { useSurfaceWeather } from '../weather/store';
import { daylightProfile } from '../weather/timeOfDay';
/** One moving shadow-casting sun; fixture lighting supplies the interior contrast. */
export function IndustrialLighting(){
 const sun=useRef<THREE.DirectionalLight>(null),ambient=useRef<THREE.AmbientLight>(null),hemisphere=useRef<THREE.HemisphereLight>(null);
 useFrame(({camera},dt)=>{
  if(!sun.current)return;
  const s=useSurfaceWeather.getState(),w=surfaceWeather(s.previewSol??s.sol),day=daylightProfile(s.previewSol===null?s.seconds:360),blend=1-Math.exp(-Math.min(dt,.1)*2);
  sun.current.position.set(camera.position.x+day.direction[0]*125,camera.position.y+day.direction[1]*125,camera.position.z+day.direction[2]*125);
  sun.current.target.position.copy(camera.position);sun.current.target.updateMatrixWorld();
  sun.current.intensity=THREE.MathUtils.lerp(sun.current.intensity,2.25*day.daylight*(1-w.dust*.82-w.cloud*.15),blend);
  if(ambient.current)ambient.current.intensity=THREE.MathUtils.lerp(ambient.current.intensity,.07+.23*day.daylight,blend);
  if(hemisphere.current)hemisphere.current.intensity=THREE.MathUtils.lerp(hemisphere.current.intensity,.12+.58*day.daylight,blend);
 });
 return <><ambientLight ref={ambient} intensity={.3} color="#9ba5cd"/><hemisphereLight ref={hemisphere} args={['#9ba8d2','#47303b',.7]}/><directionalLight ref={sun} position={[-60,100,-40]} color="#ffe0b8" intensity={2.25} castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-100} shadow-camera-right={100} shadow-camera-top={100} shadow-camera-bottom={-100} shadow-camera-far={280} shadow-normalBias={.035}/></>;
}
