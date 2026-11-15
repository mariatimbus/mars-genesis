import { useRef } from 'react';
import { useFrame,useThree } from '@react-three/fiber';
/** Keep high-DPI displays from overwhelming the GPU. The scene and textures
 * stay intact; only internal pixel density responds to sustained slow frames. */
export function RenderBudget(){
 const setDpr=useThree(s=>s.setDpr),dpr=useThree(s=>s.viewport.dpr);
 const sample=useRef({warmup:0,time:0,frames:0});
 useFrame((_,dt)=>{
  if(document.hidden||!document.hasFocus())return;
  const s=sample.current;s.warmup+=dt;if(s.warmup<4)return;
  s.time+=dt;s.frames++;
  if(s.time<3)return;
  const mean=s.time/s.frames;s.time=0;s.frames=0;
  if(mean>1/28&&dpr>1)setDpr(Math.max(1,dpr-.25));
  else if(mean<1/50&&dpr<Math.min(1.5,window.devicePixelRatio))setDpr(Math.min(1.5,window.devicePixelRatio,dpr+.25));
 });return null;
}
