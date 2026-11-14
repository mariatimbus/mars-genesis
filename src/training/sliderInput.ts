export function rangeValueAt(clientX:number,left:number,width:number,max:number){
 const inset=Math.min(8,width/2),travel=Math.max(1,width-inset*2);
 return Math.round(Math.min(1,Math.max(0,(clientX-left-inset)/travel))*max);
}
