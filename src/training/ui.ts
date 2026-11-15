import { create } from 'zustand';
import { taskById,type TaskId,type TrainingRoom } from './catalog';
/** false = a room's challenges, 'all' = list of all challenges, 'cards' = Discovery Book cards. */
export type BookView=false|'all'|'cards';
export const useTrainingUI=create<{open:boolean;room:TrainingRoom;book:BookView;scoped:boolean;repairTask:TaskId|null;repair:(task:TaskId)=>void;show:(room?:TrainingRoom,scoped?:boolean)=>void;close:()=>void;choose:(room:TrainingRoom)=>void;showBook:(book:BookView)=>void}>(set=>({open:false,room:'solar',book:false,scoped:false,repairTask:null,repair:task=>{document.exitPointerLock?.();set({open:true,room:taskById(task).room,book:false,scoped:false,repairTask:task})},show:(room,scoped=false)=>{document.exitPointerLock?.();set(s=>({open:true,room:room??s.room,book:false,scoped:scoped&&!!room,repairTask:null}))},close:()=>set({open:false,repairTask:null}),choose:room=>set({room,book:false,repairTask:null}),showBook:book=>set({book})}));
