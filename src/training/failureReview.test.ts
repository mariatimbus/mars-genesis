import { describe,it,expect } from 'vitest';
import { failureReview } from './failureReview';
import { initialTask,reduceTask,applyTraining,restartTrainingTask,type TaskAction } from './engine';
import { attemptFor,advanceChallengeClock,type ChallengeAttempt } from './attempts';
import { createScenario } from '../simulation/survival';
import { solveTraining } from './testHelpers';
import { enterSurfaceSol,repairSurfaceIncident } from '../weather/incidentActions';
import type { TaskId } from './catalog';

const timeout:ChallengeAttempt={status:'failed',elapsed:90,retryAt:120,reason:'Time limit reached. System isolated.',suspends:true,failure:{kind:'timeout'}};
describe('feedback before retry',()=>{
 const submissions:[TaskId,TaskAction,string][]=[
  ['battery',{type:'connect'},'red, blue, yellow, green, purple'],
  ['scan',{type:'dig'},'before scanning'],
  ['melt',{type:'heat',value:1},'without loading'],
  ['filter',{type:'run'},'filter order was empty'],
  ['fill',{type:'connect'},'0 units'],
  ['lights',{type:'test'},'red 0 needs 50–100'],
  ['plant',{type:'test'},'empty, empty, empty'],
  ['irrigate',{type:'test'},'bed 2: 20 needs 50–70'],
  ['antenna',{type:'send'},'65° away'],
  ['weather',{type:'match',index:0,value:1},'thermometer to pressure'],
 ];
 for(const [id,action,why] of submissions)it(`explains the failed ${id} operation and restates its rules after save/reload`,()=>{
  let s=restartTrainingTask(solveTraining(createScenario()),id);
  s=applyTraining(s,id,action);s=JSON.parse(JSON.stringify(s));
  const run=attemptFor(s,id)!;
  expect(run.status).toBe('failed');expect(run.failure?.action).toEqual(action);
  const review=failureReview(id,s.commissioning.training.tasks[id]!, 'lesson',run);
  expect(review.explanation).toContain(why);expect(review.steps.length).toBeGreaterThan(1);
 });
 it('uses the failed repair board and tighter repair limits',()=>{
  let s=enterSurfaceSol(solveTraining(createScenario()),284);
  for(const [index,value] of [50,50,20].entries())s=repairSurfaceIncident(s,'ice-clouds',{type:'light',index,value});
  s=repairSurfaceIncident(s,'ice-clouds',{type:'test'});
  const review=failureReview('lights',s.commissioning.training.incidents!.repairs.lights!,'repair',attemptFor(s,'lights','repair'));
  expect(review.explanation).toContain('red 50 needs 58–68');expect(review.explanation).toContain('total 120 exceeds 115');
  expect(review.steps.join(' ')).toContain('45 seconds');expect(review.steps.join(' ')).not.toContain('130');
 });
 it('records timeout separately from the most recent earlier mistake',()=>{
  let s=applyTraining(createScenario(),'dust',{type:'begin-attempt'});
  s=applyTraining(s,'dust',{type:'wipe',index:0});
  for(let i=0;i<180;i++)s=advanceChallengeClock(s,.5);
  const run=attemptFor(s,'dust')!;
  expect(run.failure).toEqual({kind:'timeout'});
  const review=failureReview('dust',s.commissioning.training.tasks.dust!,'lesson',run);
  expect(review.explanation).toContain('60-second active-play deadline expired');expect(review.explanation).toContain('23 layers left');
 });
 it('supports old saved timeouts and gives the actual progress in both weather rounds',()=>{
  const {failure:_,...old}=timeout;
  let t=initialTask('weather',true);
  t=reduceTask('weather',t,{type:'match',index:0,value:0});
  expect(failureReview('weather',t,'repair',old).explanation).toContain('1 of 4 sensor connections');
  for(let index=1;index<4;index++)t=reduceTask('weather',t,{type:'match',index,value:index});
  t=reduceTask('weather',t,{type:'match',index:2,value:1});
  const run={...timeout,failure:{kind:'operation' as const,action:{type:'match',index:2,value:1}}};
  expect(failureReview('weather',t,'repair',run).explanation).toContain('spinning-vane check to pressure');
  expect(failureReview('weather',t,'repair',timeout).explanation).toContain('0 of 4 calibration checks');
 });
 it('distinguishes failed heating, opening the lid, and a timeout with a fully melted sample',()=>{
  const t=initialTask('melt');t.values=[1,1,60,0,100,0,0,1];
  expect(failureReview('melt',t,'lesson',timeout).explanation).toContain('HEAT to be released');
  expect(failureReview('melt',t,'lesson',{...timeout,failure:{kind:'operation',action:{type:'lid'}}}).explanation).toContain('opened the lid');
  expect(failureReview('melt',t,'lesson',{...timeout,failure:{kind:'operation',action:{type:'tick'}}}).explanation).toContain('heating continued');
 });
 it('retains guided mistake feedback when a later harmless action replaces the current note',()=>{
  let t=reduceTask('checkup',initialTask('checkup'),{type:'match',index:0,value:1});
  t=reduceTask('checkup',t,{type:'scan',index:0});
  expect(t.note).toContain('Muscle weakness');
  expect(failureReview('checkup',t).explanation).toBe('Scan this crew member before choosing support.');
  expect(failureReview('checkup',t).steps.join(' ')).toContain('weak muscles → exercise');
 });
 it('recaps all timed repair variants without presenting a timeout as a wrong submission',()=>{
  for(const id of ['dust','battery','filter','lights','weather'] as TaskId[]){
   const review=failureReview(id,initialTask(id,true),'repair',timeout);
   expect(review.explanation).toContain('deadline expired');expect(review.steps.join(' ')).toContain('seconds of active play');
  }
  expect(failureReview('filter',initialTask('filter',true),'repair',timeout).steps.join(' ')).toContain('second sample');
 });
});
