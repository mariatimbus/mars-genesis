import { useGame } from '../store/game';
import { modeledWeatherTemperature } from '../nasa/environment';
import { references } from './catalog';
import { useTrainingUI } from './ui';
export function WeatherForecast(){
 const g=useGame();
 if(!g.commissioning.training.weatherUnlocked)return <div className="training-weather"><span className="eyebrow">WEATHER STATION OFFLINE</span><p>Assemble the four laboratory sensors to unlock the archive-guided forecast.</p><button onClick={()=>useTrainingUI.getState().show('research')}>Open weather training</button></div>;
 return <div className="training-weather"><span className="eyebrow">WEATHER STATION / MODEL + ARCHIVE</span><h3>Next operations cycle</h3><div className="weather-prediction"><strong>{modeledWeatherTemperature(g.sol,g.seed)}°C<small>Modeled cycle temperature</small></strong><strong>{g.environment.dustUntil>g.sol?'Dust disruption':'No active dust event'}<small>Current mission conditions</small></strong></div><p>Archived MEDA reference: high −22°C, low −83°C, Perseverance sols 43–44. The temperature cycle is a game model; a new mission event can change conditions.</p><a href={references.meda.url} target="_blank" rel="noreferrer">NASA archive / not live data ↗</a></div>;
}
