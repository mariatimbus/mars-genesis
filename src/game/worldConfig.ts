export interface LandPlot { id: string; minX: number; maxX: number; minZ: number; maxZ: number }
export const WORLD = {
  buildHalfWidth: 25, buildHalfDepth: 23,
  terrainWidth: 150, terrainDepth: 150,
  maxCameraDistance: 100, cameraFar: 300,
} as const;
export const BASE_PLOT: LandPlot = {id:'base',minX:-25,maxX:25,minZ:-23,maxZ:23};
// Small, individually selectable parcels: 10 × 10 world units, never a global unlock.
export const EXPANSION_PLOTS: LandPlot[] = Array.from({length:3},(_,layer)=>
  Array.from({length:4},(_,segment)=>[
    {id:`east-${layer}-${segment}`,minX:25+layer*10,maxX:35+layer*10,minZ:-20+segment*10,maxZ:-10+segment*10},
    {id:`west-${layer}-${segment}`,minX:-35-layer*10,maxX:-25-layer*10,minZ:-20+segment*10,maxZ:-10+segment*10},
    {id:`north-${layer}-${segment}`,minX:-20+segment*10,maxX:-10+segment*10,minZ:-33-layer*10,maxZ:-23-layer*10},
    {id:`south-${layer}-${segment}`,minX:-20+segment*10,maxX:-10+segment*10,minZ:23+layer*10,maxZ:33+layer*10},
  ]).flat(),
).flat();
export const ownedPlots = (ids: string[] = []) => EXPANSION_PLOTS.filter(p=>ids.includes(p.id));
const overlap=(a:number,b:number,c:number,d:number)=>Math.min(b,d)-Math.max(a,c)>1e-6;
function adjacent(a:LandPlot,b:LandPlot){
  return ((a.maxX===b.minX||a.minX===b.maxX)&&overlap(a.minZ,a.maxZ,b.minZ,b.maxZ))
    ||((a.maxZ===b.minZ||a.minZ===b.maxZ)&&overlap(a.minX,a.maxX,b.minX,b.maxX));
}
export function expansionCandidates(ids: string[] = []) {
  const regions=[BASE_PLOT,...ownedPlots(ids)];
  return EXPANSION_PLOTS.filter(p=>!ids.includes(p.id)&&regions.some(region=>adjacent(p,region)));
}
export function insideBuildArea(x:number,z:number,margin=0,ids:string[]=[]){
  if(!Number.isFinite(x)||!Number.isFinite(z)||!Number.isFinite(margin)||margin<0)return false;
  const regions=[BASE_PLOT,...ownedPlots(ids)];
  const contains=(px:number,pz:number)=>regions.some(p=>px>=p.minX&&px<=p.maxX&&pz>=p.minZ&&pz<=p.maxZ);
  if(margin===0)return contains(x,z);
  // Partition the footprint at parcel boundaries, so buildings may cross a
  // confirmed seam but cannot straddle a missing corner or an unowned parcel.
  const xs=[x-margin,...regions.flatMap(p=>[p.minX,p.maxX]).filter(v=>v>x-margin&&v<x+margin),x+margin].sort((a,b)=>a-b);
  const zs=[z-margin,...regions.flatMap(p=>[p.minZ,p.maxZ]).filter(v=>v>z-margin&&v<z+margin),z+margin].sort((a,b)=>a-b);
  for(let i=1;i<xs.length;i++)for(let j=1;j<zs.length;j++)if(xs[i]>xs[i-1]&&zs[j]>zs[j-1]&&!contains((xs[i]+xs[i-1])/2,(zs[j]+zs[j-1])/2))return false;
  return true;
}
export function originalElevation(x:number,z:number){
 const edge=Math.max(0,(Math.hypot(x*.95,z)-24)/9);
 return .06*Math.sin(x*.8)*Math.cos(z*.6)+edge*(1.2+1.4*Math.sin(x*.23+z*.3)**2)+Math.max(0,Math.abs(x)-32)*.3;
}
export function elevation(x:number,z:number,plots:LandPlot[]=[]){
  const original=originalElevation(x,z);
  let flatten=0;
  for(const p of plots){
    const distance=Math.hypot(Math.max(p.minX-x,0,x-p.maxX),Math.max(p.minZ-z,0,z-p.maxZ));
    const t=Math.max(0,1-distance/2);
    flatten=Math.max(flatten,t*t*(3-2*t));
  }
  return original*(1-flatten)+.06*Math.sin(x*.8)*Math.cos(z*.6)*flatten;
}
