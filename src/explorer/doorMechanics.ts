export const DOOR_WIDTH=2.66,DOOR_HEIGHT=2.65,DOOR_SLATS=5;
export const DOOR_SLAT_HEIGHT=DOOR_HEIGHT/DOOR_SLATS;
/** Telescoping leaves stow above head height in the ceiling cassette. */
export function doorSlatPose(index:number,progress:number){
 const p=Math.max(0,Math.min(1,progress));
 return {y:DOOR_SLAT_HEIGHT*(index+.5)*(1-p)+(2.99+index*.02)*p,z:index*.018*p};
}
// Keep the opening physically blocked until the visible leaves have cleared it.
export const doorPassable=(progress:number)=>progress>=.985;
