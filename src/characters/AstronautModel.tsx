import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

export const ASTRONAUT_ASSET = '/models/astronaut/apollo-suit.glb';
const SUIT_HEIGHT = 1.9123;
export interface AstronautMotion {speed:number;sleeping:boolean}
interface Props { height?:number; accent?:string; phase?:number; animated?:boolean; attentive?:boolean; motion?:{current:AstronautMotion} }

/** The Smithsonian suit scan keeps its original PBR maps; only materials are cloned per crew member. */
function LoadedSuit({height=1.88,accent='#b4a449',phase=0,animated=true,attentive=false,motion}:Props) {
  const {scene:source} = useGLTF(ASTRONAUT_ASSET);
  const root=useRef<THREE.Group>(null),pack=useRef<THREE.Group>(null);
  const animation=useMemo(()=>({time:{value:phase},turn:{value:0},walk:{value:0},gait:{value:phase}}),[phase]);
  const {model,materials}=useMemo(()=>{
    const model=source.clone(true),materials:THREE.MeshStandardMaterial[]=[];
    model.traverse(obj=>{
      if(!(obj instanceof THREE.Mesh))return;
      obj.castShadow=true;obj.receiveShadow=true;
      const clone=(sourceMaterial:THREE.MeshStandardMaterial)=>{
        const m=sourceMaterial.clone();m.envMapIntensity=.45;m.color.multiply(new THREE.Color('#b9c2db'));
        // A gentle neck rotation rather than spinning the entire body toward the player.
        m.onBeforeCompile=shader=>{
          shader.uniforms.crewTime=animation.time;shader.uniforms.crewTurn=animation.turn;shader.uniforms.crewWalk=animation.walk;shader.uniforms.crewGait=animation.gait;
          const header='uniform float crewTime; uniform float crewTurn; uniform float crewWalk; uniform float crewGait;\n';
          shader.vertexShader=header+shader.vertexShader;
          shader.vertexShader=shader.vertexShader.replace('#include <beginnormal_vertex>', `
            #include <beginnormal_vertex>
            float neckWeight = smoothstep(1.48, 1.64, position.y);
            float headAngle = crewTurn * neckWeight;
            mat3 headRotation = mat3(cos(headAngle),0.,-sin(headAngle), 0.,1.,0., sin(headAngle),0.,cos(headAngle));
            objectNormal = headRotation * objectNormal;
          `).replace('#include <begin_vertex>', `
            #include <begin_vertex>
            vec3 neckPivot = vec3(0.,1.51,0.);
            transformed = headRotation * (transformed-neckPivot) + neckPivot;
            float chest = smoothstep(.85,1.12,position.y) * (1.-smoothstep(1.36,1.48,position.y));
            transformed.z += sin(crewTime * 1.65) * .002 * chest;
            float leg = 1. - smoothstep(.78, 1.02, position.y);
            float side = position.x < 0. ? -1. : 1.;
            float stride = sin(crewGait) * side * crewWalk;
            transformed.z += stride * .15 * leg;
            transformed.y += max(0., stride) * .065 * (1.-smoothstep(.2,.75,position.y));
            float arm = smoothstep(.22,.35,abs(position.x)) * smoothstep(.65,.85,position.y) * (1.-smoothstep(1.35,1.52,position.y));
            transformed.z -= stride * .1 * arm;
          `);
        };
        m.customProgramCacheKey=()=> 'ares-crew-suit-v2';materials.push(m);return m;
      };
      obj.material=Array.isArray(obj.material)?obj.material.map(clone):clone(obj.material);
    });
    return {model,materials};
  },[source,animation]);
  useEffect(()=>()=>materials.forEach(m=>m.dispose()),[materials]);
  const localCamera=useMemo(()=>new THREE.Vector3(),[]);
  const time=useRef(phase);
  useFrame(({camera},dt)=>{
    if(!root.current)return;
    if(animated)time.current+=Math.min(dt,.05);
    animation.time.value=time.current;
    const sleeping=motion?.current.sleeping??false,speed=motion?.current.speed??0;
    animation.walk.value=THREE.MathUtils.damp(animation.walk.value,sleeping?0:Math.min(1,speed/1.15),10,Math.min(dt,.1));
    animation.gait.value+=Math.min(dt,.1)*speed*5.4;
    if(pack.current)pack.current.visible=!sleeping;
    root.current.position.y=Math.abs(Math.sin(animation.gait.value))*.018*animation.walk.value;
    root.current.rotation.z=animated&&!sleeping?Math.sin(time.current*.55)*.004+Math.sin(animation.gait.value)*.009*animation.walk.value:0;
    root.current.scale.y=1+(animated?Math.sin(time.current*1.65)*.0008:0);
    root.current.worldToLocal(localCamera.copy(camera.position));
    const nearby=attentive&&!sleeping&&speed<.1&&localCamera.length()<5&&localCamera.z>0;
    const turn=nearby?THREE.MathUtils.clamp(Math.atan2(localCamera.x,localCamera.z),-.3,.3):Math.sin(time.current*.23)*.06;
    animation.turn.value=THREE.MathUtils.damp(animation.turn.value,animated&&!sleeping?turn:0,3,Math.min(dt,.1));
  });
  const hose=useMemo(()=>new THREE.CatmullRomCurve3([
    new THREE.Vector3(-.2,1.18,-.19),new THREE.Vector3(-.34,.96,-.06),new THREE.Vector3(-.29,.88,.22),new THREE.Vector3(-.13,1.05,.19),
  ]),[]);
  return <group scale={height/SUIT_HEIGHT} dispose={null}>
    <group ref={root}>
      <primitive object={model}/>
      <group ref={pack}>
      {/* Added life-support pack and hose adapt the historical scan for the fictional Mars crew. */}
      <RoundedBox args={[.39,.54,.21]} radius={.035} smoothness={3} position={[0,1.23,-.25]} castShadow receiveShadow><meshStandardMaterial color="#626a80" roughness={.8} metalness={.15}/></RoundedBox>
      <mesh position={[0,1.23,-.36]}><boxGeometry args={[.32,.43,.025]}/><meshStandardMaterial color="#393f56" roughness={.7}/></mesh>
      <mesh position={[0,1.42,-.38]}><boxGeometry args={[.29,.045,.025]}/><meshStandardMaterial color={accent} roughness={.65}/></mesh>
      {[-1,1].map(side=><mesh key={side} position={[side*.135,1.22,-.385]}><boxGeometry args={[.024,.3,.018]}/><meshStandardMaterial color="#414c50" roughness={.75}/></mesh>)}
      <mesh castShadow><tubeGeometry args={[hose,24,.018,8,false]}/><meshStandardMaterial color="#714956" roughness={.9}/></mesh>
      <mesh position={[-.13,1.05,.19]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.035,.035,.045,16]}/><meshStandardMaterial color={accent} metalness={.65} roughness={.35}/></mesh>
      </group>
    </group>
  </group>;
}
export function AstronautModel(props:Props) {
  // The local model loads separately, without suspending physics or the rest of the base.
  return <Suspense fallback={null}><LoadedSuit {...props}/></Suspense>;
}
