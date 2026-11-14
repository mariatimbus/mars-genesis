import { insideBuildArea } from '../game/worldConfig';

export type Kind = 'solar' | 'greenhouse' | 'oxygen' | 'habitat' | 'research' | 'storage' | 'medical' | 'water';
export type Resources = { oxygen:number; power:number; food:number; materials:number };
export type Building = { id:string; kind:Kind; x:number; z:number; active:boolean; damage?:number; repairUntil?:number };
export const catalog: Record<Kind,{name:string;cost:number;radius:number;description:string;delta:Partial<Resources>}> = {
 solar:{name:'Solar array',cost:35,radius:3.1,description:'Photovoltaic cells turn sunlight into electricity. Dust reduces their output.',delta:{power:24}},
 greenhouse:{name:'Greenhouse',cost:55,radius:3.2,description:'A protected ecosystem grows food and releases a little oxygen.',delta:{food:1.1,power:-9}},
 oxygen:{name:'Oxygen plant',cost:45,radius:2.1,description:'Electrolysis uses water and electricity to produce breathable oxygen.',delta:{oxygen:2.6,power:-10}},
 habitat:{name:'Crew habitat',cost:50,radius:2.8,description:'Safe pressurized living space for four crew. Air circulation and heating need energy.',delta:{power:-5}},
 research:{name:'Research lab',cost:60,radius:2.3,description:'Engineers recover construction materials. Operating equipment needs power.',delta:{power:-8,materials:3}},
 medical:{name:'Medical bay',cost:45,radius:2.4,description:'A powered treatment and recovery space. An assigned medic helps the crew recover.',delta:{power:-4}},
 water:{name:'Water facility',cost:40,radius:2.3,description:'A powered recycling loop recovers crew water. Working depots extract ice to replace losses.',delta:{power:-6}},
 storage:{name:'Supply depot',cost:25,radius:2,description:'Extract local ice using electricity, adding up to 2 kg of water per sol.',delta:{}}
};
export const initialBuildings: Building[] = [
 ['greenhouse',0,0],['greenhouse',9,-5],['greenhouse',8,7],['habitat',-1,9],['habitat',-7,-7],['oxygen',-7,1],['oxygen',-11,5],['solar',-16,-3],['solar',-16,5],['solar',16,0],['solar',16,8],['research',1,-8],['storage',-7,13],['storage',6,15],['storage',-1,-15],['medical',-16,-14],['water',10,-15]
].map(([kind,x,z],i)=>({id:`initial-${i}`,kind:kind as Kind,x:Number(x),z:Number(z),active:false}));
export function validPlacement(kind:Kind,x:number,z:number,buildings:Building[],expandedPlots:string[]=[]){
 return insideBuildArea(x,z,catalog[kind].radius,expandedPlots)&&buildings.every(b=>Math.hypot(b.x-x,b.z-z)>catalog[kind].radius+catalog[b.kind].radius+.5);
}
