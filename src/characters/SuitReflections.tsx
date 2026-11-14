import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { PMREMGenerator } from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/** Local reflection lighting: no CDN HDRI or runtime network dependency. */
export function SuitReflections() {
  const {gl,scene}=useThree();
  useEffect(()=>{
    const generator=new PMREMGenerator(gl),room=new RoomEnvironment();
    const target=generator.fromScene(room,.04);
    const previous=scene.environment,previousIntensity=scene.environmentIntensity;
    scene.environment=target.texture;scene.environmentIntensity=.2;
    room.dispose();generator.dispose();
    return()=>{scene.environment=previous;scene.environmentIntensity=previousIntensity;target.dispose()};
  },[gl,scene]);
  return null;
}
