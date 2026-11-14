import { useEffect, useRef, useState } from 'react';
import { advanceFlight, clamp01 } from '../game/flightPath';
export function useFlightPlayback(reducedMotion:boolean,endAt=1){
 const progressRef=useRef(0);
 const [progress,setProgress]=useState(0),[playing,setPlaying]=useState(!reducedMotion);
 useEffect(()=>{
  if(!playing)return;
  let frame=0,last=performance.now(),lastPaint=last;
  const update=(now:number)=>{
   // Background tabs pause the cinematic rather than skipping its whole journey.
   progressRef.current=advanceFlight(progressRef.current,Math.min(.1,(now-last)/1000),endAt);last=now;
   if(now-lastPaint>=80||progressRef.current>=endAt){setProgress(progressRef.current);lastPaint=now;}
   if(progressRef.current<endAt)frame=requestAnimationFrame(update);else setPlaying(false);
  };
  frame=requestAnimationFrame(update);return()=>cancelAnimationFrame(frame);
 },[playing,endAt]);
 const seek=(value:number,play=false)=>{const p=clamp01(value);progressRef.current=p;setProgress(p);setPlaying(play&&p<1)};
 const toggle=()=>{if(progressRef.current>=1)seek(0,true);else{setProgress(progressRef.current);setPlaying(p=>!p)}};
 return {progress,progressRef,playing,seek,toggle,restart:()=>seek(0,!reducedMotion)};
}
