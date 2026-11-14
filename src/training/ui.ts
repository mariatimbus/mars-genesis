import { create } from 'zustand';
import type { TrainingRoom } from './catalog';
export const useTrainingUI=create<{open:boolean;room:TrainingRoom;book:boolean;show:(room?:TrainingRoom)=>void;close:()=>void;choose:(room:TrainingRoom)=>void;showBook:(book:boolean)=>void}>(set=>({open:false,room:'solar',book:false,show:room=>{document.exitPointerLock?.();set(s=>({open:true,room:room??s.room,book:false}))},close:()=>set({open:false}),choose:room=>set({room,book:false}),showBook:book=>set({book})}));
