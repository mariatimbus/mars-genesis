import { useEffect,useMemo,useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useExplorer } from '../explorer/store';
import { useGame } from '../store/game';
import { useTrainingUI } from '../training/ui';
import type { Layout } from '../explorer/layout';
import { seededRandom } from '../explorer/terrain';
import { terrainHeight } from '../explorer/fixtures';
import { ownedPlots } from '../game/worldConfig';
import { atmosphereSheltered,surfaceWeather } from './calendar';
import { useSurfaceWeather } from './store';
import { daylightProfile } from './timeOfDay';

const noRaycast=()=>null;
const skyVertex=`varying vec3 direction;
void main(){direction=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const skyFragment=`
uniform float time, cloud, dust, daylight;
uniform vec2 drift;
varying vec3 direction;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.03+vec2(17.1,7.3);a*=.5;}return v;}
void main(){
 vec3 d=normalize(direction);
 vec3 zenith=mix(vec3(.19,.20,.29),vec3(.43,.29,.23),dust);
 vec3 horizon=mix(vec3(.59,.43,.34),vec3(.70,.44,.28),dust);
 vec3 color=mix(horizon,zenith,pow(max(0.,d.y),.55));
 // A distant, thin water-ice layer. No rain or terrestrial cumulus.
 vec2 p=d.xz/(max(d.y,0.)+.22)*vec2(2.2,7.5)+drift*.008;
 float wisps=fbm(p+fbm(p*.47));
 float veil=smoothstep(.62-cloud*.24,.79-cloud*.14,wisps)*cloud;
 veil*=smoothstep(.015,.16,d.y)*(1.-dust*.8);
 color=mix(color,vec3(.84,.85,.89),veil*.88);
 color=mix(vec3(.012,.018,.037)+veil*vec3(.035,.04,.055),color,daylight);
 gl_FragColor=vec4(color,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
const dustVertex=`
uniform float time,wind,heading,large,gust;
uniform vec2 travel;
uniform sampler2D shelter;
uniform vec4 bounds;
varying float fade;
void main(){
 vec3 p=position;
 p.xz=mod(p.xz+travel+100.,200.)-100.;
 p.y+=sin(time*.7+p.z*.2)*.25;
 vec4 world=modelMatrix*vec4(p,1.);
 vec2 uv=(world.xz-bounds.xy)/bounds.zw;
 float inside=step(0.,uv.x)*step(uv.x,1.)*step(0.,uv.y)*step(uv.y,1.);
 float covered=texture2D(shelter,clamp(uv,0.,1.)).r*inside*step(-.5,world.y)*step(world.y,4.1);
 vec4 mv=viewMatrix*world;
 gl_Position=projectionMatrix*mv;
 gl_PointSize=min(large>.5?180.:3.,(large>.5?1100.:30.)/max(1.,-mv.z));
 fade=(1.-smoothstep(35.,100.,-mv.z))*(1.-covered);
}`;
const dustFragment=`
uniform float opacity,large;
varying float fade;
void main(){float r=length(gl_PointCoord-.5)*2.;float a=pow(max(0.,1.-r*r),large>.5?3.:1.5)*opacity*fade;
 if(a<.002)discard;
 gl_FragColor=vec4(.68,.43,.28,a);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
function shelterMask(layout?:Layout){
 const cells=layout?[...layout.cells].map(k=>k.split(',').map(Number)):[];
 const minX=cells.length?Math.min(...cells.map(c=>c[0])):0,minZ=cells.length?Math.min(...cells.map(c=>c[1])):0;
 const width=cells.length?Math.max(...cells.map(c=>c[0]))-minX+1:1,height=cells.length?Math.max(...cells.map(c=>c[1]))-minZ+1:1;
 const data=new Uint8Array(width*height);
 cells.forEach(([x,z])=>{data[(z-minZ)*width+x-minX]=255});
 const texture=new THREE.DataTexture(data,width,height,THREE.RedFormat);texture.needsUpdate=true;
 return {texture,bounds:new THREE.Vector4(minX*3-1.5,minZ*3-1.5,width*3,height*3)};
}
/** The same sky follows the astronaut, rover, inspector and colony camera.
 * All particles are decorative: no colliders, raycast hits or gameplay effects.
 */
export function MarsAtmosphere({layout,preview=false,overview=false}:{layout?:Layout;preview?:boolean;overview?:boolean}){
 const expanded=useGame(s=>s.expandedPlots),plots=useMemo(()=>ownedPlots(expanded),[expanded]);
 const sky=useRef<THREE.Mesh>(null),sun=useRef<THREE.Mesh>(null),grains=useRef<THREE.Points>(null),haze=useRef<THREE.Points>(null);
 const mask=useMemo(()=>shelterMask(layout),[layout]);
 useEffect(()=>()=>mask.texture.dispose(),[mask]);
 const uniforms=useMemo(()=>({time:{value:0},cloud:{value:.1},dust:{value:.1},daylight:{value:1},drift:{value:new THREE.Vector2(1,0)}}),[]);
 const grainUniforms=useMemo(()=>({time:{value:0},travel:{value:new THREE.Vector2()},wind:{value:.2},heading:{value:0},gust:{value:0},large:{value:0},opacity:{value:.12},shelter:{value:mask.texture},bounds:{value:mask.bounds}}),[mask]);
 const hazeUniforms=useMemo(()=>({...grainUniforms,large:{value:1},opacity:{value:.025}}),[grainUniforms]);
 const particles=useMemo(()=>{
  const random=seededRandom(981),fine=new Float32Array(2200*3),soft=new Float32Array(170*3);
  for(let i=0;i<2200;i++)fine.set([(random()-.5)*200,random()*13,(random()-.5)*200],i*3);
  for(let i=0;i<170;i++)soft.set([(random()-.5)*200,random()*3,(random()-.5)*200],i*3);
  return {fine,soft};
 },[]);
 const fogColor=useMemo(()=>new THREE.Color(),[]),sunDirection=useMemo(()=>new THREE.Vector3(-60,100,-40).normalize(),[]);
 const activeTime=useRef(0);
 useFrame(({camera,scene},delta)=>{
  const dt=Math.min(.1,Math.max(0,delta)),state=useSurfaceWeather.getState(),w=surfaceWeather(state.previewSol??state.sol);
  const day=daylightProfile(state.previewSol===null?state.seconds:360);
  sunDirection.set(...day.direction);
  uniforms.daylight.value=THREE.MathUtils.lerp(uniforms.daylight.value,day.daylight,1-Math.exp(-dt*2));
  const blend=1-Math.exp(-dt*.8);
  uniforms.cloud.value=THREE.MathUtils.lerp(uniforms.cloud.value,w.cloud,blend);
  uniforms.dust.value=THREE.MathUtils.lerp(uniforms.dust.value,w.dust,blend);
  grainUniforms.wind.value=THREE.MathUtils.lerp(grainUniforms.wind.value,w.wind,blend);
  // Integrate travel rather than multiplying a changing speed by total time.
  grainUniforms.heading.value+=Math.atan2(Math.sin(w.heading-grainUniforms.heading.value),Math.cos(w.heading-grainUniforms.heading.value))*blend;
  grainUniforms.gust.value=w.gust;
  const dx=Math.cos(grainUniforms.heading.value),dz=Math.sin(grainUniforms.heading.value);
  uniforms.drift.value.x+=dx*dt*(1+w.wind);uniforms.drift.value.y+=dz*dt*(1+w.wind);
  const d=uniforms.dust.value;
  uniforms.time.value+=dt;grainUniforms.time.value+=dt;
  const travel=dt*(.6+grainUniforms.wind.value*8)*(1+.25*Math.sin(grainUniforms.time.value*.9+w.gust));
  grainUniforms.travel.value.x=(grainUniforms.travel.value.x+dx*travel)%200;grainUniforms.travel.value.y=(grainUniforms.travel.value.y+dz*travel)%200;
  grainUniforms.opacity.value=.08+d*.45;hazeUniforms.opacity.value=d*d*.19;
  const far=(camera as THREE.PerspectiveCamera).far??500;
  sky.current?.position.copy(camera.position);sky.current?.scale.setScalar(far*.85);
  if(sun.current){sun.current.position.copy(camera.position).addScaledVector(sunDirection,far*.65);sun.current.scale.setScalar(far*.65/300);const m=sun.current.material as THREE.MeshBasicMaterial;m.opacity=(1-d*.88)*day.daylight;m.color.setRGB(1,.91-d*.32,.75-d*.43);}
  const ground=layout?terrainHeight(layout,camera.position.x,camera.position.z,plots):0;
  for(const ref of [grains,haze])if(ref.current)ref.current.position.set(camera.position.x,ground+.2,camera.position.z);
  if(scene.fog instanceof THREE.Fog){
   fogColor.setRGB(.52+d*.15,.39+d*.03,.36-d*.1).multiplyScalar(.07+.93*uniforms.daylight.value);scene.fog.color.copy(fogColor);
   const scale=overview?.52:1;
   const sheltered=layout&&atmosphereSheltered(layout.cells,camera.position.x,camera.position.y,camera.position.z);
   scene.fog.near=(sheltered?100:100-d*95)*scale;scene.fog.far=(sheltered?370:370-d*305)*scale;
  }
  const e=useExplorer.getState(),g=useGame.getState();
  if(!preview&&!overview&&state.previewSol===null&&e.locked&&!e.panel&&!useTrainingUI.getState().open&&!document.hidden&&g.status==='playing'&&!g.pendingEvent){
   activeTime.current+=dt;if(activeTime.current>=.5){state.tick(activeTime.current);activeTime.current=0;}
  }
 });
 return <>
  <mesh ref={sky} raycast={noRaycast} renderOrder={-1000} frustumCulled={false}><sphereGeometry args={[1,32,16]}/><shaderMaterial side={THREE.BackSide} depthTest={false} depthWrite={false} uniforms={uniforms} vertexShader={skyVertex} fragmentShader={skyFragment}/></mesh>
  <mesh ref={sun} raycast={noRaycast} frustumCulled={false}><sphereGeometry args={[1.2,16,12]}/><meshBasicMaterial color="#fff0d0" fog={false} transparent depthWrite={false}/></mesh>
  <points ref={haze} raycast={noRaycast} frustumCulled={false}><bufferGeometry><bufferAttribute attach="attributes-position" args={[particles.soft,3]}/></bufferGeometry><shaderMaterial transparent depthWrite={false} uniforms={hazeUniforms} vertexShader={dustVertex} fragmentShader={dustFragment}/></points>
  <points ref={grains} raycast={noRaycast} frustumCulled={false}><bufferGeometry><bufferAttribute attach="attributes-position" args={[particles.fine,3]}/></bufferGeometry><shaderMaterial transparent depthWrite={false} uniforms={grainUniforms} vertexShader={dustVertex} fragmentShader={dustFragment}/></points>
 </>;
}
