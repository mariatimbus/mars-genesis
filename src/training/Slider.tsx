import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { rangeValueAt } from './sliderInput';
export function Slider({label,value,onChange,max=100,format}:{label:string;value:number;onChange:(value:number)=>void;max?:number;format?:(value:number)=>string}){
 const [draft,setDraft]=useState(value),dragging=useRef(false),latest=useRef(value),callback=useRef(onChange),timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 callback.current=onChange;
 useEffect(()=>()=>{if(timer.current!==null)clearTimeout(timer.current)},[]);
 const update=(next:number)=>{latest.current=next;setDraft(next);if(timer.current===null)timer.current=setTimeout(()=>{timer.current=null;callback.current(latest.current)},50)};
 const fromPointer=(event:PointerEvent<HTMLInputElement>)=>{const r=event.currentTarget.getBoundingClientRect();return rangeValueAt(event.clientX,r.left,r.width,max)};
 const finish=()=>{if(!dragging.current)return;dragging.current=false;if(timer.current!==null){clearTimeout(timer.current);timer.current=null;}callback.current(latest.current);setDraft(latest.current)};
 const shown=dragging.current?draft:value;
 return <label className="training-slider"><span>{label}<b>{format?format(Math.round(shown)):`${Math.round(shown)}${max===90?'°':''}`}</b></span><input type="range" aria-label={label} min={0} max={max} value={shown} style={{touchAction:'none'}}
  onPointerDown={event=>{if(event.button!==0)return;event.preventDefault();event.currentTarget.focus({preventScroll:true});dragging.current=true;event.currentTarget.setPointerCapture(event.pointerId);update(fromPointer(event))}}
  onPointerMove={event=>{if(dragging.current)update(fromPointer(event))}}
  onPointerUp={event=>{if(dragging.current)update(fromPointer(event));finish()}}
  onPointerCancel={finish} onLostPointerCapture={finish}
  onChange={event=>{const next=Number(event.target.value);if(dragging.current)update(next);else callback.current(next)}}/>
 </label>;
}
