import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
// Opt-in local diagnostics, stripped out of production by the DEV guard.
export const profiling=import.meta.env.DEV&&new URLSearchParams(window.location.search).has('perf');
export function FrameProbe(){
 const samples=useRef<number[]>([]),elapsed=useRef(0);
 useFrame(({gl},dt)=>{
  if(!profiling||document.hidden)return;
  elapsed.current+=dt;samples.current.push(dt*1000);
  if(elapsed.current<2)return;
  const values=samples.current.sort((a,b)=>a-b),mean=values.reduce((a,b)=>a+b,0)/values.length;
  const out=document.getElementById('render-metrics');
  if(out)out.textContent=`${(1000/mean).toFixed(1)} FPS · p95 ${values[Math.floor(values.length*.95)].toFixed(0)} ms · ${gl.info.render.calls} draws · ${(gl.info.render.triangles/1e6).toFixed(2)} M triangles`;
  elapsed.current=0;samples.current=[];
 });return null;
}
export function FrameReadout(){return profiling?<output id="render-metrics" style={{position:'fixed',top:6,left:'35%',zIndex:9999,padding:8,background:'#000',color:'#aaffaa',font:'12px monospace',pointerEvents:'none'}}>Measuring frames…</output>:null}
