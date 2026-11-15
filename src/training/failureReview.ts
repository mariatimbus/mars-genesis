import { briefings } from './briefings';
import { taskById,type TaskId } from './catalog';
import { circuitCables,cableComplete,iceColumns,irrigationBands,type TaskState } from './engine';
import { deadlineFor,type AttemptMode,type ChallengeAttempt } from './attempts';

export interface FailureReview {explanation:string;steps:string[]}
const number=(n:number|undefined)=>Number.isFinite(n)?Math.round(n!*10)/10:0;
/** Uses the failed board and committed action, never an invented diagnosis.
 * Older saved failures without action metadata still receive a rules recap.
 */
export function failureReview(id:TaskId,t:TaskState,mode:AttemptMode='lesson',run?:ChallengeAttempt):FailureReview {
 const hard=mode==='repair',v=t.values,value=(i:number)=>number(v[i]);
 const context=run?.failure,action=context?.action??t.lastMistake?.action;
 const timeout=context?.kind==='timeout'||(!context&&run?.reason.startsWith('Time limit reached.'));
 let explanation='',steps=[...briefings[id].rules];
 switch(id){
  case 'dust':{
   const cells=v.filter(n=>n>0).length,layers=v.reduce((a,b)=>a+b,0);
   explanation=`${cells} of 12 cells still had dust (${layers} layers left). Any remaining coating prevents this cleaning check from passing; returned dust must also be removed.`;
   steps=[`Brush all 12 cells until every cell is blue: ${hard?'three':'two'} layers per cell.`,hard?'Two storm gusts recoat cells after four and eight cells are cleared. Clean those cells again.':'A gust returns dust halfway through. Clean that cell again.','The challenge completes only when every cell has zero dust.'];break;
  }
  case 'sun':explanation=`You collected ${value(1).toFixed(1)} of the required 15 seconds of aligned sunlight. Time spent more than 12° from the Sun does not count.`;break;
  case 'battery':{
   const open=circuitCables.filter(c=>!cableComplete(v,c.color)).map(c=>c.name.toLowerCase());
   explanation=open.length?`The ${open.join(', ')} cable path${open.length===1?' was':'s were'} still open. Power needs all five complete paths before you switch on.`:'The completed circuit still needed its final Switch on check before the deadline.';break;
  }
  case 'scan':{
   const col=value(0),scanned=t.marks.includes(col),material=iceColumns[col];
   explanation=timeout?`You had not extracted a verified blue-echo ice sample before the deadline. ${scanned?'The selected column was scanned, but the extraction check was unfinished.':'Scan a column first, then drill only a blue ice return.'}`:!scanned?`You tried to drill column ${col+1} before scanning it. A position alone does not establish that the teaching sample contains ice.`:`Column ${col+1} returned ${material===1?'orange frozen soil':'grey basalt'}, rather than the blue ice return required for drilling. Scanning is safe; drilling commits the operation.`;break;
  }
  case 'melt':{
   explanation=timeout?`Melting reached ${value(4)}%. ${value(4)>=100?'The melted sample still needed HEAT to be released to finish the check.':'The sample must finish melting and HEAT must be released before time runs out.'}`:action?.type==='lid'?'You opened the lid while the heater was running. The sample must stay sealed and pressurized during heating.':context?.note==='Load ice first.'?'You tried to start HEAT without loading an ice sample. Load the ice before sealing, pressurizing and heating.':value(4)>=100?'The sample had already melted, but heating continued. Release HEAT as soon as melting reaches 100% to avoid overheating.':!v[1]||value(2)<50||value(2)>90?`The tank was ${v[1]?'sealed':'open'}, with pressure ${value(2)} training units. Heating requires a closed lid and the green pressure band, 50–90.`:`Melting was only ${value(4)}% complete. Load a sample before heating and finish the controlled melt cycle.`;
   steps=['Load ice, close the lid, then pump into the green 50–90 pressure band (training units).','Hold HEAT while the sample warms and melts. The 0°C plateau is normal.','Release HEAT at 100% melted; do not open the lid while heating.'];break;
  }
  case 'filter':{
   const order=t.marks.map(i=>['grille','fine filter','desalination membrane'][i]).join(' → ');
   explanation=timeout?`${value(0)} of ${hard?2:1} samples had passed the conductivity check. Building the column and running water do not replace that final check.`:action?.type==='test'?`You tested before a correctly assembled filter train had processed the sample. The test cannot verify unprocessed water.`:`Your filter order was ${order||'empty'}. Coarse debris must be removed before the fine filter and membrane, or the finer barrier clogs.`;
   steps=['Fit grille → fine filter → desalination membrane, from top to bottom.','Run water only after all three filters are in the correct order.','Then perform the conductivity test; low conductivity checks dissolved ions, not every possible contaminant.',...(hard?['Repeat with a fresh filter train and verify a second sample before release.']:[])];break;
  }
  case 'fill':explanation=timeout?`The cell was at ${value(0)} units when time expired. Reach exactly 60 units, then press Connect to complete the check.`:`You connected the cell at ${value(0)} units, ${value(0)<60?'below':value(0)>60?'above':'at'} the 60-unit target. The level must be exactly 60 when you connect; pouring and draining are draft adjustments.`;break;
  case 'air':explanation=timeout?`Only ${value(2).toFixed(1)} of 30 stable seconds were collected. Pausing the regulator does not pause the attempt deadline.`:`The air gauge ${v[0]<30?'fell below 30':'rose above 80'} training units. The teaching model requires it to stay in the green 30–80 band while the crew demand changes.`;
   steps=['Start the regulator and adjust the inlet valve to match changing consumption.','Keep the gauge in the green 30–80 training band; this is not a real oxygen-percentage specification.','Accumulate 30 seconds in the band. Leaving it ends this attempt.'];break;
  case 'lights':{
   const problems:string[]=[];
   const bands=hard?[[58,68],[36,46],[8,18]]:[[50,100],[30,100],[0,100]];
   bands.forEach(([min,max],i)=>{if(value(i)<min||value(i)>max)problems.push(`${['red','blue','green'][i]} ${value(i)} needs ${min}–${max}`)});
   const total=v.reduce((a,b)=>a+b,0),budget=hard?115:130;if(total>budget)problems.push(`total ${total} exceeds ${budget}`);
   explanation=problems.length?`The submitted recipe failed these checks: ${problems.join('; ')}. The recipe must meet the light targets and power budget together.`:'The settings were in range but still needed their final Test the light recipe check before the deadline.';
   steps=hard?['Set red to 58–68, blue to 36–46 and green to 8–18.','Keep the sum of all three sliders at or below 115.','Check every target, then submit with Test the light recipe.']:['Supply at least 50 red and 30 blue light.','Keep the total lighting budget at or below 130.','Adjust the draft sliders freely, then submit with Test the light recipe.'];break;
  }
  case 'plant':explanation=`Your beds were ${v.map(i=>['lettuce','mizuna','dwarf tomato'][i]??'empty').join(', ')}. ${timeout?'The planting check was not completed in time. ':''}The confirmed plan needs one of each crop, with no empty or duplicate beds.`;break;
  case 'irrigate':{
   const wrong=irrigationBands.flatMap(([min,max],i)=>value(i)<min||value(i)>max?[`bed ${i+1}: ${value(i)} needs ${min}–${max}`]:[]);
   explanation=timeout?`The root-zone inspection was not completed in time. ${wrong.length?`Still outside the bands: ${wrong.join('; ')}.`:'All three beds were green, but still needed the final inspection.'}`:`The confirmed root-zone check was outside its bands: ${wrong.join('; ')}. Too little or too much water fails this training check; adjust before confirming.`;
   steps=['Use small pours or drains to adjust each bed.','Target lettuce 40–60, mizuna 50–70 and the research bed 30–50 training units.','Confirm only when all three root zones are green.'];break;
  }
  case 'antenna':explanation=timeout?t.phase===1?'The transmission was aligned and sent, but the reply had not returned before the deadline. Align and send early enough to allow both signal journeys.':'No transmission was completed before the deadline. Aim at Earth, within 5° of the 65° target, then send and wait for the reply.':`You sent at ${value(0)}°, ${Math.abs(value(0)-65)}° away from Earth’s 65° target in this model. The allowed pointing error is at most 5°; align first, then transmit.`;break;
  case 'weather':{
   const i=action?.index??-1,j=action?.value??-1,quantities=['temperature','pressure','wind','light / dust'];
   const names=hard&&t.phase===1?['cooling reference','pressure reference','spinning-vane check','reference lamp']:['thermometer','barometer','wind vane','optical sensor'];
   explanation=timeout?`${t.marks.length} of 4 ${hard&&t.phase===1?'calibration checks':'sensor connections'} were verified in this round. ${hard?'Both rounds are required.':'All four connections are required.'}`:Number.isInteger(i)&&Number.isInteger(j)&&i>=0&&i<4&&j>=0&&j<4?`You matched the ${names[i]} to ${quantities[j]}. It belongs to ${quantities[i]}, not ${quantities[j]}. Each channel must measure the right quantity.`:'A sensor was connected to the wrong quantity. Match the instrument to what it measures before connecting it.';
   steps=['Thermometer → temperature; barometer → pressure.','Wind vane → wind; optical sensor → light / dust.',...(hard?['After all four connections, match the cooling reference, pressure reference, vane check and reference lamp to the same quantities.']:[])];break;
  }
  default:explanation=t.lastMistake?.message||taskById(id).hint;
 }
 const limit=deadlineFor(id,mode);
 if(timeout)explanation=`The ${limit??number(run?.elapsed)}-second active-play deadline expired. ${explanation}`;
 if(limit!==undefined)steps.push(`Complete the challenge within ${limit} seconds of active play. Resetting the board or switching challenges does not refill the timer.`);
 return {explanation,steps};
}
