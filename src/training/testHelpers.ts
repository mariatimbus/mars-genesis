// Scripted player input for integration tests: all completions use the real reducer.
import { applyTraining, initialTask, sunAngle, type TaskAction } from './engine';
import { tasks, type TaskId } from './catalog';
// One valid cable layout for the 6×6 board (cells are row*6+column).
export const circuitSolution:[number,number[]][]=[[1,[1,2,3,9]],[2,[5,11,17,23,29]],[3,[16,22]],[4,[7,8,14,20,26,27]],[5,[18,24,30,31,32,33]]];
import type { SurvivalState } from '../simulation/types';
export function solveTask(s:SurvivalState,id:TaskId):SurvivalState {
 let state=s;const act=(type:string,index?:number,value?:number)=>{state=applyTraining(state,id,{type,index,value},1000)};
 const tick=(seconds:number)=>{for(let i=0;i<seconds*4;i++)act('tick',undefined,.25)};
 switch(id){
 case 'dust':for(let i=0;i<12;i++){act('wipe',i);act('wipe',i)}act('wipe',0);break;
 case 'sun':for(let i=0;i<62;i++){const t=state.commissioning.training.tasks.sun??initialTask('sun');act('angle',undefined,sunAngle(t.time+.25));act('tick',undefined,.25)}break;
 case 'battery':for(const [color,cells] of circuitSolution)for(const cell of cells)act('draw',cell,color);act('connect');break;
 case 'scan':act('move',undefined,3);act('scan');act('dig');break;
 case 'melt':act('load');act('lid');for(let i=0;i<3;i++)act('pump');act('heat',undefined,1);tick(12.5);act('heat',undefined,0);break;
 case 'filter':for(let i=0;i<3;i++)act('choose',i);act('run');act('test');break;
 case 'fill':for(let i=0;i<6;i++)act('pour');act('connect');break;
 case 'split':act('load');act('current');for(let i=0;i<6;i++)act('sort',i,i%3===0?1:0);break;
 case 'air':act('valve',undefined,40);tick(30);break;
 case 'lights':act('light',0,60);act('light',1,40);act('light',2,10);act('test');break;
 case 'plant':for(let i=0;i<3;i++)act('seed',i,i);act('test');break;
 case 'irrigate':for(let i=0;i<3;i++)for(let j=0;j<4;j++)act('water',i,10);act('test');break;
 case 'kit':[0,1,2,3,3].forEach((target,i)=>act('match',i,target));break;
 case 'gravity':act('sol',undefined,30);for(let i=0;i<3;i++)act('zone',i);break;
 case 'checkup':for(let i=0;i<3;i++){act('scan',i);act('match',i,i)}break;
 case 'antenna':act('angle',undefined,65);act('send',undefined,3);tick(11);break;
 case 'rock':for(let i=0;i<3;i++){act('focus',undefined,65);act('identify',i)}break;
 case 'weather':for(let i=0;i<4;i++)act('match',i,i);break;
 }
 return state;
}
export const solveTraining=(s:SurvivalState)=>tasks.reduce((state,t)=>solveTask(state,t.id),s);
