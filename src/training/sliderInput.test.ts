import { describe,it,expect } from 'vitest';
import { rangeValueAt } from './sliderInput';
import { applyTraining } from './engine';
import { createScenario } from '../simulation/scenario';
import { solveTask } from './testHelpers';
describe('training mouse sliders',()=>{
 it('maps the pointer to the range and clamps a captured drag outside either end',()=>{
  expect(rangeValueAt(108,100,200,90)).toBe(0);expect(rangeValueAt(200,100,200,90)).toBe(45);expect(rangeValueAt(292,100,200,90)).toBe(90);
  expect(rangeValueAt(-200,100,200,90)).toBe(0);expect(rangeValueAt(700,100,200,90)).toBe(90);
 });
 it('keeps world data references stable during a live drag and never mutates the prior state',()=>{
  const s=solveTask(createScenario(),'dust'),before=structuredClone(s),n=applyTraining(s,'sun',{type:'angle',value:65});
  expect(n.buildings).toBe(s.buildings);expect(n.resources).toBe(s.resources);expect(n.astronauts).toBe(s.astronauts);expect(n.systems).toBe(s.systems);expect(n.history).toBe(s.history);
  expect(n.commissioning.training.tasks.sun?.values[0]).toBe(65);expect(s).toEqual(before);
  const timed=applyTraining(n,'sun',{type:'tick',value:.25});expect(timed.commissioning.training.tasks.sun?.values[0]).toBe(65);expect(timed.buildings).toBe(s.buildings);
 });
});
