import balance from '../data/balanceConfig.json';
import observations from '../data/historicalObservations.json';
// Measured inputs drive these simplified models. Coefficients are gameplay assumptions,
// not a fitted transfer curve or a prediction for a human Mars mission.
export function modeledDustTransmission(tau=observations.dust.opticalDepth,severity=1){return Math.max(.18,Math.min(.35,Math.exp(-tau*.13)/severity));}
export function modeledSolarExtraMsv(severity:number){
 // Deliberately independent of flare class: DONKI/SDO does not measure a Mars dose.
 return balance.solarWarningExtraMsvPerSol*severity;
}
export function modeledWeatherTemperature(sol:number,seed:number){const {highC,lowC}=observations.weather;return Math.round((highC+lowC)/2+(highC-lowC)/2*Math.sin((sol+seed%7)*1.4));}
export { observations };
