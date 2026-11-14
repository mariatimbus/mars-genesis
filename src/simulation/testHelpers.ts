import { createScenario } from './scenario';
import { answerStartup, STARTUP_CHALLENGES } from './commissioning';
import type { SurvivalState } from './types';
export function commissionAll(s:SurvivalState){
 return STARTUP_CHALLENGES.reduce((state,c)=>answerStartup(state,c.kind,c.options.find(o=>o.correct)!.id),s);
}
export const readyScenario=(...args:Parameters<typeof createScenario>)=>commissionAll(createScenario(...args));
