import { create } from 'zustand';
import type { TrainingRoom } from './catalog';
export const useTrainingUI=create<{open:boolean;room:TrainingRoom;book:boolean;scoped:boolean;show:(room?:TrainingRoom,scoped?:boolean)=>void;close:()=>void;choose:(room:TrainingRoom)=>void;showBook:(book:boolean)=>void}>(set=>({open:false,room:'solar',book:false,scoped:false,show:(room,scoped=false)=>{document.exitPointerLock?.();set(s=>({open:true,room:room??s.room,book:false,scoped:scoped&&!!room}))},close:()=>set({open:false}),choose:room=>set({room,book:false}),showBook:book=>set({book})}));
