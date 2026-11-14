import { createScenario } from './scenario';
import { solveTraining } from '../training/testHelpers';
import type { SurvivalState } from './types';
export const commissionAll=(s:SurvivalState)=>solveTraining(s);
export const readyScenario=(...args:Parameters<typeof createScenario>)=>commissionAll(createScenario(...args));
